package main

import (
	"context"
	"os"
	"fmt"
	"time"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	pool "github.com/jackc/pgx/v5/pgxpool"
)


// Global database connection pool
var dbPool *pool.Pool

type Workout struct {
	ID 	   int
	PersonID   string
	HeartRate  *int
	Calories   *int
	Duration   *int
	Timestamp  time.Time
}


func helloTestHandler(c *gin.Context) {
	c.JSON(http.StatusOK, 
		gin.H {
			"message": "Hello!!!",
	})
}

func getPersonWorkouts(c *gin.Context) {
	personID := c.Param("person_id")

	ctx := context.Background()
	rows, err := dbPool.Query(ctx,
			"SELECT id, person_id, heart_rate, calories, duration, timestamp FROM workouts WHERE person_id = $1 ORDER BY timestamp DESC",
			personID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"Error": "Database Query Failed"})
		return
	}

	defer rows.Close()

	// Iterate through all queried rows to create output
	var workouts []Workout
	for rows.Next() {
		var w Workout
		err := rows.Scan(&w.ID, &w.PersonID, &w.HeartRate, &w.Calories, &w.Duration, &w.Timestamp)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"Error":"Parsing of query output failed"})
			return
		}

		workouts = append(workouts, w)
	}

	if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"Error":"Parsing rows failed"})
			return

	}

	c.JSON(http.StatusOK, workouts)
}

func getAllPeople(c *gin.Context) {

	ctx := c.Request.Context()

	rows, err := dbPool.Query(ctx,
	                 "SELECT DISTINCT person_id FROM workouts",
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error":"Failed to run query"})
		return
	}
	defer rows.Close()

	var people []string
	for rows.Next() {
		var person string
		err := rows.Scan(&person)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error":"Parsing people rows failed"})
			return
		}
		people = append(people, person)
	}

	if rows.Err() != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error":"Parsing people rows failed"})
		return
	}

	c.JSON(http.StatusOK, people)
}

func addPersonWorkouts(c *gin.Context) {
	ctx := c.Request.Context()
	var workouts Workout

	err := c.ShouldBindJSON(&workouts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Add workout to database - activity
	rows, err := dbPool.Query(ctx,
	                 "INSERT INTO workouts (person_id, heart_rate, calories, duration) VALUES ($1, $2, $3, $4)",
			 workouts.PersonID, *workouts.HeartRate, *workouts.Calories, *workouts.Duration,
	)
	defer rows.Close()

	if err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{"Error": "Database Query Failed"})
		return
	}

	fmt.Fprintf(os.Stderr, "ID received:::: %v\n", *workouts.Duration)
	c.JSON(http.StatusOK, gin.H{"message": "Workout added"})

}

func main() {

	// Connect to database - activity
	ctx := context.Background()
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://pop:popoff@localhost:5432/activity"
	}

	var err error
	dbPool, err = pool.New(ctx, connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Database connection failed: %v\n", err)
		os.Exit(1)
	}
	defer dbPool.Close()


	// Setup gin webframework
	r := gin.Default()

	// Added becuase running react on localhost:3000 and this server on localhost:9000 
	// Not the same host (protocol + host + port) led to cross-origin error CORS 
	// TODO: Add nginx to avoid this. Both server and dashboard behind nignx
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://pop-off-phi.vercel.app",
		                           "http://localhost:3000"}, // your Next.js dev URL
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: true,
        }))

	r.GET("/hello-test", helloTestHandler)
	r.GET("/api/workouts/:person_id", getPersonWorkouts)
	r.GET("/api/people", getAllPeople)
	r.POST("/api/workouts", addPersonWorkouts)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}

	r.Run(":" + port)
}
