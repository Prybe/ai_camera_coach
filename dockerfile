# Step 1: Specify the base image. Here, we use the official Node.js image from Docker Hub.
FROM --platform=linux/amd64 node:21-alpine

# Step 2.1: Install build tools for canvas package
RUN apk add python3 make g++

# Step 2.2: Install canvas package dependencies
RUN apk add --no-cache cairo-dev jpeg-dev pango-dev giflib-dev

# Step 3: Setup User
RUN addgroup -S appuser && adduser -S -g appuser appuser \
    && mkdir -p /home/appuser/Downloads /app \
    && chown -R appuser:appuser /home/appuser \
    && chown -R appuser:appuser /app

# Run everything after as non-privileged user.
USER appuser

# Step 4: Set the working directory inside the container to /app.
WORKDIR /app

# Step 5: Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache layers.
# Ensure the user 'appuser' owns the copied files.
COPY --chown=appuser:appuser package*.json ./

# Step 6: Copy the rest of your application's code into the container.
COPY --chown=appuser:appuser . .

# Step 7: Install your application's dependencies including Puppeteer.
# Use `npm ci` for production builds as it's faster and more reliable for CI/CD environments.
RUN npm install --only=production

# Step 8: Expose the port your app runs on. Adjust this if your app uses a different port.
EXPOSE 3000

# Step 9: Define the command to run your app. Adjust if your app starts differently.
CMD ["node", "server.js"]
