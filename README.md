# pop-off

## Idea
“Pop Off” is for your family and friends to see your live/daily workout stats. The end user has a display that shows live and daily metrics of friends and family. This could be something that goes on the family refrigerator like a magnet or placed on your nightstand/common room table. 
-	Safety aspect – letting your dear ones know when and where you are when doing a workout, especially outdoor runs/walks or even an indoor activity at a new gym during late hours. 
-	Motivational aspect – let your family and friends see your daily workout activity for motivation. Visibility is motivation. 
-	Build it yourself – hardware metrics display can be a build it yourself with 3d printed enclosures and some soldering if needed to appeal to other engineers. 

## Initial Design
1.	Apple Watch
Apple watch only app that stores live workout metrics (HR, calories) and GPS info into the app and sends it to a database

2.	Database
Holds all data coming from the watch app until polled by the metrics live display

3.	Live Display
Polls the database every 1 – 2minute and plots data into user friendly stats. 

## Implementation
Once the watch app is installed on personA, they should then link their app to the live display device. PersonA is then added to the live display and their workout metrics can be observed going forward. PersonA could be added to more than one live display. The live data only gets send once to the database, the database logic then takes care of how the information gets stored so that all live displays can poll the info. 

### Tech Stack
Go
PostgreSQL
React
REST API

## Planning 
### Phase 1
-	Backend – Go + PostgreSql
o	Write to PostgreSql
-	Frontend - React
o	React for metrics display webpage
-	Data Collection – REST API
o	Use an existing workout API to poll workout info (Strava, NRC) for existing workouts


