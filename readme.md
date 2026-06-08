
# Team Collaboration & Communication Application

A full-stack team collaboration and communication platform that combines real-time communication with structured task management. Built entirely with TypeScript, the application features role-based access control, encrypted messaging, and a responsive UI, all backed by a scalable GraphQL API and websockets for real time chats.

## Overview

TeamChat is a platform that allow users to create their own teams and join any public teams and manage and delete tasks for team member with live statuses update for tasks. Each team have its own real-time chat room along with admin and member roles.
## Features

- Authentication: Implement secure user registration/login via email and google oauth.
- Teams Management: User can create and join any public team, if team is private only admin can add the members to the team.
- Task Management: Users can create task and assign to any member of the team and view all their created and assign tasks and only admin or task creator is able to delete the task or change the deadline of the task.
- Manage Roles: Admin can manage the roles of the team members.
- Notifications Management: Users will receive the notifications for unread messages and if any new member added to the team and if task deadline missed and admin also receive notification if any user join the team. 


## Tech Stack

* Frontend: React.js, Material UI, TypeScript
* Backend: Node.js, typescript, type-graphql, websockets
* Database: PostgreSQL, TypeORM
* API: Graphql, websockets


## Prerequisites
You will need to have the following software installed on your machine:
* [Node.js](https://nodejs.org/en/download)
* [PostgreSQL](https://www.postgresql.org/download)
## Installation

* Clone the repository
```bash
  git clone https://github.com/Jahnavi-Celestial/teams-collaboration-and-communication.git
  cd teams-collaboration-and-communication
```

* Backend Setup
```bash
  cd server
  npm install 
  # Create a .env file and add your configuration(see below)
  npm run dev
```

* Frontend Setup
```bash
  cd ../client
  npm install 
  # Create a .env file and add your configuration(see below)
  npm run dev
```

## CI/CD Deployment Setup (GitHub Actions)

The repository includes pre-configured GitHub Actions workflow files inside the `.github/workflows/` directory. If you fork or clone this repository and want the automated deployment to work, you must add the following **Repository Secrets** in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

*   `PRODUCTION_BACKEND_URL`: Your production backend url.
*   `PRODUCTION_WS_URL`: Your production frontend url.
*   `RENDER_BACKEND_DEPLOY_HOOK`: Your render backend deploy hook or whatever platform you use for deployment.
*   `RENDER_FRONTEND_DEPLOY_HOOK`: Your render frontend deploy hook or whatever platform you use for deployment.
    
## Environment Variables

Create a .env file in your root/server directory with following keys:

`JWT_SECRET =  your_jwt_secret_key`

`DATABASE_URL = your_database_url`

`GOOGLE_CLIENT_ID = your_google_client_id`

`FRONTEND_URL = your_frontend_url`

`ENCRYPTION_KEY = your_encryption_key_to_encrypt_messages_before_storing_them_to_database`

`PORT = your_port_number`

Create a .env file in your root/client directory with following keys:

`VITE_GOOGLE_CLIENT_ID = your_google_client_id`

`VITE_BACKEND_URL = your_backend_url`

`VITE_WS_URL = your_websocket_connection_url`


## Project Structure

* /.github/workflows: Contains backend and frontend yml files.
* /client: Contains the react application and material ui components.
* /server: Contains the node.js/typescript server and graphql resolvers.


## User Flow Reference
1. [General User Flow](https://celestialsystem-my.sharepoint.com/:w:/g/personal/jahnavi_gaur_celestialsys_com/IQB5PtSwL4VzTJvrGBTjvWGHAR5iAkJwGa38yCCOgxELfbA?e=rOpHV2)
2. [Technical User Flow](https://celestialsystem-my.sharepoint.com/:w:/g/personal/jahnavi_gaur_celestialsys_com/IQCvrHcBbmn6TaDtEPPd6IICAUUQXVbwkSjtGma-_7A7c54?e=ibCtsQ)