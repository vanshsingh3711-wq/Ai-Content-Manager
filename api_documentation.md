# AI Content Manager - API Design Documentation

This document outlines the design and behavior of the REST API for the AI Content Manager backend. The API is built using **FastAPI** and is organized into routers for modularity.

## Core / System Endpoints
**File Location:** `apps/api/main.py`

### 1. Root Endpoint
- **Method / Path:** `GET /`
- **Purpose:** Base entry point to verify the API is running and lists common endpoints.
- **Returns (Success):** `200 OK` with a JSON object containing the API status and available endpoints.
- **Returns (Failure):** N/A (Rarely fails unless the server is down).

### 2. Health Check
- **Method / Path:** `GET /health`
- **Purpose:** System monitoring and frontend verification.
- **Returns (Success):** `200 OK` with JSON `{"status": "healthy", "service": "api", "environment": "...", "queue": "..."}`.
- **Returns (Failure):** `500 Internal Server Error` if the server is unhealthy.

### 3. System Stats
- **Method / Path:** `GET /api/v1/system/stats`
- **Purpose:** Returns basic system statistics from the database (total users and total jobs).
- **Returns (Success):** `200 OK` with JSON `{"total_users": <int>, "total_video_jobs": <int>}`.
- **Returns (Failure):** `500 Internal Server Error` on database connection issues.

---

## Videos Module
**File Location:** `apps/api/routers/videos.py`
Responsible for managing video records and initiating video processing workflows.

### 1. Create Video Job
- **Method / Path:** `POST /api/v1/videos/create-job`
- **Purpose:** Registers a new video job in the database after the source video has been uploaded to storage. Automatically dispatches the job to the Celery worker queue if `AUTO_DISPATCH_JOBS` is enabled.
- **Returns (Success):** `201 Created` with a `VideoJobResponse` object containing job details, ID, and status (`QUEUED`).
- **Returns (Failure):** `422 Unprocessable Entity` if the request payload fails validation (e.g., missing title or source URL). `500 Internal Server Error` on database write failures.

### 2. List Video Jobs
- **Method / Path:** `GET /api/v1/videos`
- **Purpose:** Lists all video processing jobs ordered by creation date. Supports pagination (`limit` and `offset`).
- **Returns (Success):** `200 OK` with a list of `VideoJobResponse` objects.
- **Returns (Failure):** `422 Unprocessable Entity` for invalid query parameters.

### 3. Get Video Job Details
- **Method / Path:** `GET /api/v1/videos/{video_id}`
- **Purpose:** Retrieves a single video job and its current processing status by ID.
- **Returns (Success):** `200 OK` with the `VideoJobResponse` object.
- **Returns (Failure):** `404 Not Found` if a job with the provided ID does not exist. `422 Unprocessable Entity` if the ID is an invalid UUID.

### 4. Update Job Status
- **Method / Path:** `PATCH /api/v1/videos/{video_id}/status`
- **Purpose:** Updates the state machine status, rendered URL, edit decisions, or error logs of a job. (Typically called by background workers).
- **Returns (Success):** `200 OK` with the updated `VideoJobResponse` object.
- **Returns (Failure):** `404 Not Found` if the job does not exist. `422 Unprocessable Entity` if the payload format is incorrect.

### 5. Delete Video Job
- **Method / Path:** `DELETE /api/v1/videos/{video_id}`
- **Purpose:** Deletes a video job entirely from the database.
- **Returns (Success):** `204 No Content`.
- **Returns (Failure):** `404 Not Found` if the job does not exist.

---

## Jobs & Queues Module
**File Location:** `apps/api/routers/jobs.py`
Responsible for manual queue management and detailed status monitoring of Celery background jobs.

### 1. Dispatch Job to Queue
- **Method / Path:** `POST /api/v1/jobs/{job_id}/dispatch`
- **Purpose:** Manually triggers the dispatch of a video job to the Celery workers.
- **Returns (Success):** `200 OK` with a `DispatchJobResponse` indicating successful dispatch and the Celery Task ID.
- **Returns (Failure):** 
  - `404 Not Found` if the job does not exist.
  - `400 Bad Request` if the job is not in a dispatchable state (must be `QUEUED` or `FAILED`).

### 2. Retry Failed Job
- **Method / Path:** `POST /api/v1/jobs/{job_id}/retry`
- **Purpose:** Resets a failed video job's state back to `QUEUED`, clears its error logs, and re-dispatches it to Celery.
- **Returns (Success):** `200 OK` with a `DispatchJobResponse`.
- **Returns (Failure):** `404 Not Found` if the job does not exist.

### 3. Get Job Queue Status
- **Method / Path:** `GET /api/v1/jobs/{job_id}/status`
- **Purpose:** Returns the current state machine status, rendered URL, error logs, and edit lists. Similar to getting a video job but returns a trimmed `JobStatusResponse` payload.
- **Returns (Success):** `200 OK` with a `JobStatusResponse`.
- **Returns (Failure):** `404 Not Found` if the job does not exist.

### 4. List Queue Jobs
- **Method / Path:** `GET /api/v1/jobs`
- **Purpose:** Lists jobs currently in the processing pipeline, optionally filtered by `status_filter` (e.g., `PROCESSING`, `FAILED`).
- **Returns (Success):** `200 OK` with a list of `JobStatusResponse` objects.
- **Returns (Failure):** `422 Unprocessable Entity` if the `status_filter` is an invalid status string.

---

## Storage Module
**File Location:** `apps/api/routers/storage.py`
Handles cloud storage (S3/R2) presigned URLs and local development file uploads/downloads.

### 1. Generate Presigned URL
- **Method / Path:** `POST /api/v1/storage/presigned-url`
- **Purpose:** Generates a secure, temporary S3/R2 presigned upload URL so the frontend browser can upload heavy video files directly to the cloud.
- **Returns (Success):** `200 OK` with a `PresignedUrlResponse` (contains `upload_url`, `file_key`, and `source_url`).
- **Returns (Failure):** 
  - `400 Bad Request` if the file extension or content type is unsupported (only standard video/audio formats allowed).
  - `422 Unprocessable Entity` for invalid payload schema.

### 2. Local Dev Upload Endpoint
- **Method / Path:** `PUT /api/v1/storage/dev-upload`
- **Purpose:** Local mock upload endpoint. Stores the uploaded file in a local `media_temp` directory for local development without connecting to the cloud.
- **Returns (Success):** `200 OK` with `{"status": "success", "message": "Dev upload stored successfully", "file_key": <key>}`.
- **Returns (Failure):** `500 Internal Server Error` if disk write fails.

### 3. Local Dev Download Endpoint
- **Method / Path:** `GET /api/v1/storage/download`
- **Purpose:** Streams and downloads local media files directly in the browser from the `media_temp` directory.
- **Returns (Success):** `200 OK` with a `FileResponse` streaming the bytes of the file, or a placeholder stub.
- **Returns (Failure):** N/A (Returns a stub if the file isn't found).
