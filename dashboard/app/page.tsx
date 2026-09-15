"use client";
import {useEffect, useState} from "react";

function useUserData(getUserApi) {
	const [users, setUsers] = useState(null);
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

function usePopOffData(users, getDataApi) {
	const [data, setData] = useState(null);
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
	            	.then((workouts) => ({user, workouts}))
	        ))
	        
	            .then((result) => {
	            	const combined = {};
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

function useAddWorkout(postApi) {
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(false);

	function addWorkout(workout) {
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

function WorkoutForm({ onWorkoutAdded }) {
	const postApi = "http://localhost:8090/api/workouts";
	const { addWorkout, submitting, error, success } = useAddWorkout(postApi);

	const [personId, setPersonId] = useState("");
	const [heartRate, setHeartRate] = useState("");
	const [calories, setCalories] = useState("");
	const [duration, setDuration] = useState("");

	function handleSubmit(e) {
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
			<div>
				<label htmlFor="personId" className="form-label">Person ID</label>
				<input id="personId" className="form-input" type="text" value={personId} onChange={(e) => setPersonId(e.target.value)} required />
			</div>
			<div>
				<label htmlFor="heartRate" className="form-label">Heart Rate</label>
				<input id="heartRate" className="form-input" type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} required />
			</div>
			<div>
				<label htmlFor="calories" className="form-label">Calories</label>
				<input id="calories" className="form-input" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} required />
			</div>
			<div>
				<label htmlFor="duration">Duration</label>
				<input id="duration" className="form-input" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
			</div>
			<button type="submit" className="form-button" disabled={submitting}>
				{submitting ? "Submitting..." : "Add Workout"}
			</button>
			{error && <p>Error: {error}</p>}
			{success && <p>Workout added!</p>}
		</form>
	);
}

export default function Dashboard() {
	// Get all user names
	const getUserApi = "http://localhost:8090/api/people";
	const {users, erroruser, loadinguser} = useUserData(getUserApi)

	// Get all data for users
	const userDataApi = "http://localhost:8090/api/workouts"
	const {data, error, loading, refetch} = usePopOffData(users, userDataApi)

	if (loadinguser || loading) return <p>Loading !! ....</p>;
	if (erroruser || error) return <p>API fetch failed !! ....</p>;

	return (
		<div>
		<div>Users: {users.join(", ")}</div>

		{data && Object.entries(data).map(([user, workouts]) => (
			<div key={user}> 
			<h3>{user}</h3>
			    {workouts.map((w) => (
			        <div key={w.ID}>
			        	<div>HR {w.HeartRate}, Calories: {w.Calories}, Duration {w.Duration} </div>
			        </div>
			    ))}
			</div>
		))
		};
		<h3>Add Workout</h3>
		<div>
		<WorkoutForm onWorkoutAdded={refetch} />
		</div>
		</div>

	);
}
