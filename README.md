# IntellectWorks Test 


### Users


| Column Name   | Data Types       | contraints      | Description |
|---------------|----------------|----------------|--------|
| id | uid  | primary Key  | Unique Identifier for the user |
|email| email| NOT NULL, UNIQUE| User Email|
|password| string| NOT NULL| User password|
|displayName| string| NOT NULL| Name of User|
|createdAt| date| NOT NULL| Timestamp|

### Notes


| Column Name   | Data Types       | contraints      | Description |
|---------------|----------------|----------------|--------|
|id| uid| primary Key|Unique Identifieer for the note|
|user_id| uid|Not NULL|User uid|
|title| string| NOT NULL| title of the note|
|content|string|NOT NULL| content of the note|
|ceatedAt|date|NOT NULL|timestamp|