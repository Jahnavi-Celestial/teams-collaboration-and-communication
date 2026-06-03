import { gql } from "@apollo/client";

export const GetAllUsers = gql`
  query GetAllUsers($searchTerm: String) {
    getAllUsers(searchTerm: $searchTerm) {
      id
      name
      email
      password_hash
      google_id
      avatar_url
      created_at
      updated_at
    }
  }
`;

export const GetAllPublicTeams = gql`
  query GetAllPublicTeams($searchTerm: String) {
    getAllPublicTeams(searchTerm: $searchTerm) {
      id
      name
      description
      is_public
      created_at
      updated_at
      created_by {
        id
        name
        email
      }
      members {
        id
        role
      }
    }
  }
`;

export const GetTeams = gql`
  query GetTeams($skip: Int, $take: Int){
    getTeams(skip: $skip, take: $take){
        id
        name
        description
        is_public
        created_at
        updated_at
        created_by {
            id
            name
            email
            created_at
            updated_at
        }
    }
  }
`;

export const GetMembersOfTeam = gql`
  query GetMembersOfTeam($teamId: String!) {
    getMembersOfTeam(teamId: $teamId) {
      id
      role
      user {
        id
        name
        email
        created_at
        updated_at
      }
    }
  }
`;

export const GetAllAssignedTask = gql`
  query GetAllAssignedTask(
    $userId: String!
    $teamId: String
    $searchTerm: String
    $status: TaskStatus
  ) {
    getAllAssignedTask(
      userId: $userId
      teamId: $teamId
      searchTerm: $searchTerm
      status: $status
    ) {
      id
      subject
      description
      status
      deadline
      created_at
      team {
        id
        name
      }
      assigned_to {
        id
        name
      }
      assigned_by {
        id
        name
      }
    }
  }
`;
export const GetAllCreatedTask = gql`
  query GetAllCreatedTask(
    $userId: String!
    $teamId: String
    $searchTerm: String
    $status: TaskStatus
  ) {
    getAllCreatedTask(
      userId: $userId
      teamId: $teamId
      searchTerm: $searchTerm
      status: $status
    ) {
      id
      subject
      description
      status
      deadline
      created_at
      team {
        id
        name
      }
      assigned_to {
        id
        name
      }
      assigned_by {
        id
        name
      }
    }
  }
`;

export const GetTaskDetail = gql`
  query GetTaskDetail($taskId: String!) {
    getTaskDetail(taskId: $taskId) {
      id
      subject
      description
      status
      deadline
      created_at
      team {
        id
        name
      }
      assigned_by {
        id
        name
        email
      }
      assigned_to {
        id
        name
        email
      }
    }
  }
`;

export const GetAllMessages = gql`
  query GetAllMessages($teamId: String!, $limit: Int, $offset: Int) {
    getAllMessages(teamId: $teamId, limit: $limit, offset: $offset) {
      id
      content
      created_at
      sender {
        id
      }
    }
  }
`;
