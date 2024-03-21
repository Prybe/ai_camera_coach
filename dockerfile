# Step 1: Specify the base image. Here, we use the official Node.js 16 LTS image from Docker Hub.
FROM node:21-alpine

# Step 2: Set the working directory inside the container to /app.
WORKDIR /app

# Step 3: Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache layers.
COPY package*.json ./

# Optional: If using yarn and you have a yarn.lock file, copy it as well, and use `yarn install` in the next step.
# COPY package.json yarn.lock ./

# Step 4: Install your application's dependencies.
# Use `npm ci` for production builds as it's faster and more reliable for CI/CD environments.
RUN npm install --only=production

# Step 5: Copy the rest of your application's code into the container.
COPY . .

# Step 6: Expose the port your app runs on. Adjust this if your app uses a different port.
EXPOSE 3000

# Step 7: Define the command to run your app. Adjust if your app starts differently.
CMD ["node", "server.js"]
