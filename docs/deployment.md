# Deployment Guide

Backend (Django):

1. Create Python virtualenv, install requirements.
2. Set environment variables using `.env` (see .env.example).
3. Run `python manage.py migrate` and `python manage.py collectstatic`.
4. Use Gunicorn + Nginx for production; configure `DATABASE_URL` for PostgreSQL.

Frontend (React/Vite):

1. `npm run build`
2. Serve `dist/` via nginx or static host.
