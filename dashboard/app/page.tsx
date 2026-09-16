"use client";
import {useEffect, useState} from "react";

// ---- Config ----
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

// ---- Types ----
interface Workout {
	ID: number;
	PersonID: string;
	HeartRate: number;
	Calories: number;
	Duration: number;
	Timestamp: string;
}

interface WorkoutsByUser {
	[user: string]: Workout[];
}

function formatWorkoutDate(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function useUserData(getUserApi: string) {
	const [users, setUsers] = useState<string[] | null>(null);
	const [erroruser, setErroruser] = useState(null);
	const [loadinguser, setLoadinguser] = useState(true);

	useEffect (() => {
		let isMounted = true;

		function fetchData() {
		   fetch(getUserApi)
		   	.then((res) => {
			      if (!res.ok) throw new Error('Request Failed ${res.status}');
			      return res.json();
			})

			.then((json) => setUsers(json))
			.catch((err) => setErroruser(err.message))
			.finally(() => setLoadinguser(false));
		}

		fetchData();
		const intervalId = setInterval(fetchData, 2*60*1000);

		return () => {
			isMounted = false;
			clearInterval(intervalId);
		};
	}, [getUserApi])

	return {users, erroruser, loadinguser};

}

function usePopOffData(users: string[] | null, getDataApi: string) {
	const [data, setData] = useState<WorkoutsByUser | null>(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

        function fetchData() {
		if (!users || users.length == 0) {
			setLoading(false);
			return;
		}


	        Promise.all(
	            users.map((user) =>
	                fetch(`${getDataApi}/${user}`)
	            	.then((res) => {
	                  	if (!res.ok) throw new Error(`Request Failed ${res.status}`);
	                  	return res.json();
	            	})
	            	.then((workouts: Workout[]) => ({user, workouts}))
	        ))
	        
	            .then((result) => {
	            	const combined: WorkoutsByUser = {};
	            	result.forEach(({user, workouts}) => {
	            		combined[user] = workouts;
	            	});
	            	setData(combined);

	            })

	            .catch((err) => setError(err.message))
	            .finally(() => setLoading(false));
	}

	useEffect(() => {
		fetchData();
		const intervalId = setInterval(fetchData, 2*60*1000);

		return () => {
			clearInterval(intervalId);
		};
	}, [users, getDataApi])

	return {data, error, loading, refetch: fetchData};

}

interface NewWorkout {
	PersonID: string;
	HeartRate: number;
	Calories: number;
	Duration: number;
}

function useAddWorkout(postApi: string) {
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	function addWorkout(workout: NewWorkout) {
		setSubmitting(true);
		setError(null);
		setSuccess(false);

		return fetch(postApi, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(workout),
		})
			.then((res) => {
				if (!res.ok) throw new Error(`Request Failed ${res.status}`);
				setSuccess(true);
			})
			.catch((err) => setError(err.message))
			.finally(() => setSubmitting(false));
	}

	return { addWorkout, submitting, error, success };
}

interface WorkoutFormProps {
	onWorkoutAdded?: () => void;
}

function WorkoutForm({ onWorkoutAdded }: WorkoutFormProps) {
	const postApi = `${API_BASE_URL}/api/workouts`;
	const { addWorkout, submitting, error, success } = useAddWorkout(postApi);

	const [personId, setPersonId] = useState("");
	const [heartRate, setHeartRate] = useState("");
	const [calories, setCalories] = useState("");
	const [duration, setDuration] = useState("");

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const workout = {
			PersonID: personId,
			HeartRate: Number(heartRate),
			Calories: Number(calories),
			Duration: Number(duration),
		};

		addWorkout(workout).then(() => {
			setPersonId("");
			setHeartRate("");
			setCalories("");
			setDuration("");
			if (onWorkoutAdded) onWorkoutAdded();
		});
	}

	return (
		<form onSubmit={handleSubmit}>
		<div className="form-card">
	<span className="form-eyebrow">NEW ENTRY</span>
	<h3 className="form-heading">Log a session</h3>

	<div className="form-grid">
		<div className="form-field">
			<label htmlFor="personId" className="form-label">Person ID</label>
			<input id="personId" className="form-input" type="text" value={personId} onChange={(e) => setPersonId(e.target.value)} required />
		</div>

		<div className="form-field">
			<label htmlFor="heartRate" className="form-label">Heart Rate (bpm)</label>
			<input id="heartRate" className="form-input" type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} required />
		</div>

		<div className="form-field">
			<label htmlFor="calories" className="form-label">Calories (kcal)</label>
			<input id="calories" className="form-input" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} required />
		</div>

		<div className="form-field">
			<label htmlFor="duration" className="form-label">Duration (min)</label>
			<input id="duration" className="form-input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
		</div>
	</div>

	<button type="submit" className="form-button" disabled={submitting}>
		{submitting ? "Submitting..." : "+ Add Workout"}
	</button>

	{error && <p className="form-error">Error: {error}</p>}
	{success && <p className="form-success">Workout added!</p>}
	</div>
		</form>
	);
}

export default function Dashboard() {
	// Get all user names
	const getUserApi = `${API_BASE_URL}/api/people`;
	const {users, erroruser, loadinguser} = useUserData(getUserApi)

	// Get all data for users
	const userDataApi = `${API_BASE_URL}/api/workouts`
	const {data, error, loading, refetch} = usePopOffData(users, userDataApi)

	if (loadinguser || loading) return <p>Loading !! ....</p>;
	if (erroruser || error) return <p>API fetch failed !! ....</p>;

	return (
		<div className="dashboard-shell">
		<div className="dashboard-title-row">
		    <img src="/favicon.ico" alt="" className="dashboard-favicon" />
		    <h1 className="dashboard-heading"> pop off </h1>
		</div>
		<p className="dashboard-subhead"> workout stats </p>

		<div className="user-roster">
			Tracking {users?.length ?? 0} users: {users?.join(", ")}
		</div>

		{data && (
	<div className="user-grid">
		{Object.entries(data).map(([user, workouts]) => (
			<div key={user} className="workout-block">
				<div className="workout-block-user">{user}</div>

				
				

                         <div className="workout-entries">
                         	{workouts.map((w: Workout) => (
                         		<div key={w.ID} className="workout-entry">
                         			<div className="workout-entry-date">{formatWorkoutDate(w.Timestamp)}</div>
                         
                         			<div className="stat-row-v2">
                         				<div className="stat-item">
                         					<span className="stat-item-label">HR</span>
                         					<span className="stat-value stat-value--heart">
                         						{w.HeartRate}<span className="stat-unit">bpm</span>
                         					</span>
                         				</div>
                         
                         				<div className="stat-item">
                         					<span className="stat-item-label">CAL</span>
                         					<span className="stat-value stat-value--calories">
                         						{w.Calories}<span className="stat-unit">kcal</span>
                         					</span>
                         				</div>
                         
                         				<div className="stat-item">
                         					<span className="stat-item-label">TIME</span>
                         					<span className="stat-value stat-value--duration">
                         						{w.Duration}<span className="stat-unit">min</span>
                         					</span>
                         				</div>
                         			</div>
                         		</div>
                         	))}
                         </div>


			</div>
		))}
	</div>
)}
		<div className="form-section">
		    <WorkoutForm onWorkoutAdded={refetch} />
		</div>
		</div>

	);
}
