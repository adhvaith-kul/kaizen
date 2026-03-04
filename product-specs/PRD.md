# Product Requirements Document (PRD)

## Product Name

Kaizen

## Overview

Habit Battle is a social habit-tracking application that gamifies self-improvement through group competition. Users can create or join groups, define personal habits across five life categories, complete those habits daily, and compete on a leaderboard based on points earned.

## Goals

### Primary Goals

- Increase habit consistency through social accountability
- Create competitive motivation through leaderboards
- Make daily habit tracking simple and engaging

### Non-Goals (MVP)

- AI habit recommendations
- Habit streak rewards
- Notifications
- Chat or messaging
- Public global leaderboards
- Achievement badges

## Target Users

### Primary Users

- Students
- Young professionals
- Friend groups

### Secondary Users

- Fitness groups
- Study groups
- Startup teams

## Core Concepts

### Groups

Users participate in habit tracking inside groups.

Users may:

- Create a new group
- Join an existing group using a **group code**

Recommended group size: **2–10 users**

### Habit Categories

Five fixed categories:

1. Health
2. Finance
3. Work
4. Upskill
5. Social

Each user defines **one habit per category**.

Example:

| Category | Habit             |
| -------- | ----------------- |
| Health   | 30 min workout    |
| Finance  | Track expenses    |
| Work     | Deep work         |
| Upskill  | Study programming |
| Social   | Call a friend     |

## Features

### 1. User Authentication

Users must be able to:

- Sign up
- Log in
- Log out

Required fields:

- username
- email
- password

---

### 2. Group Creation

Users can create a group.

Inputs:

- group_name

System generated:

- group_id
- group_code

Behavior:

- Creator automatically joins the group

---

### 3. Join Group

Users can join a group using a **group code**.

Behavior:

- User becomes a member
- User can access leaderboard
- User can set habits

---

### 4. Habit Setup

Users define **one habit per category**:

- Health
- Finance
- Work
- Upskill
- Social

Example:

```
Health → Gym workout
Finance → Track expenses
Work → Deep work
Upskill → Study ML
Social → Call family
```

---

### 5. Daily Habit Tracking

Users mark habits completed each day.

Rules:

- Each habit = **10 points**
- Maximum daily points = **50**

Example:

| Category | Completed | Points |
| -------- | --------- | ------ |
| Health   | Yes       | 10     |
| Finance  | Yes       | 10     |
| Work     | No        | 0      |
| Upskill  | Yes       | 10     |
| Social   | Yes       | 10     |

Total = **40 points**

---

### 6. Leaderboard

Leaderboard ranks users by:

```
total_points = sum(all daily habit points)
```

Leaderboard fields:

- rank
- username
- total_points

---

### 7. Daily Reset

Habit completion resets every day.

Behavior:

- Habits tracked per date
- Users log completion daily
- UI resets daily

---

## User Flows

### Onboarding Flow

1. User signs up or logs in
2. User creates or joins group
3. User defines 5 habits
4. User begins daily tracking

### Daily Usage Flow

1. User opens app
2. Views today's habits
3. Marks completed habits
4. Points update
5. Leaderboard updates

---

## Screens

### Login Screen

- Email field
- Password field
- Login button
- Signup link

### Signup Screen

- Username
- Email
- Password

### Group Screen

- Create Group
- Join Group

### Habit Setup Screen

Users enter habit for each category.

### Dashboard Screen

Displays:

- Today's habits
- Completion checkboxes
- Today's score
- Current rank

Example:

```
Today's Habits

[ ] Health – Workout
[ ] Finance – Track expenses
[ ] Work – Deep work
[ ] Upskill – Study coding
[ ] Social – Call friend
```

### Leaderboard Screen

Displays:

- Rank
- Username
- Points

---

## Data Entities

- Users
- Groups
- Group Members
- Habits
- Habit Logs

---

## Metrics

Success metrics:

- Daily active users
- Habit completion rate
- 7-day retention
- Groups created per user
- Average habits completed per day

---

## Constraints

- One habit per category
- Maximum five habits per user
- Habit points fixed at 10
- Completion recorded once per day

---

## Future Features

### Gamification

- XP levels
- streak bonuses
- achievements
- badges

### Social

- comments
- reactions
- habit proof photos

### Competition

- weekly winners
- seasons
- tournaments

### AI

- habit suggestions
- progress insights
- coaching
