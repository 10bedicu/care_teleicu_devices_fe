TeleICU Devices MFE Plug for Care (Gateway, Camera and Vitals Observation Devices)

## Docker

This project includes a Dockerfile for building and running the application in a production-ready container with nginx.

### Build the Docker image

```bash
docker build -t care-teleicu-devices .
```

### Run the container

To run the container and map it to host port 10120:

```bash
docker run -d -p 10120:80 --name care-teleicu-devices care-teleicu-devices
```

Or with automatic restart:

```bash
docker run -d -p 10120:80 --name care-teleicu-devices --restart unless-stopped care-teleicu-devices
```

After running, access the application at `http://localhost:10120`.

### Useful Docker commands

```bash
# View logs
docker logs care-teleicu-devices

# Follow logs in real-time
docker logs -f care-teleicu-devices

# Stop the container
docker stop care-teleicu-devices

# Start a stopped container
docker start care-teleicu-devices

# Remove the container
docker rm care-teleicu-devices

# Rebuild and run (one-liner)
docker build -t care-teleicu-devices . && docker run -d -p 10120:80 --name care-teleicu-devices care-teleicu-devices

# Remove and rebuild everything
docker stop care-teleicu-devices && docker rm care-teleicu-devices && docker build -t care-teleicu-devices . && docker run -d -p 10120:80 --name care-teleicu-devices care-teleicu-devices
```
