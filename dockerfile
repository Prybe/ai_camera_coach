# Step 1: Specify the base image. Here, we use the official Node.js 16 LTS image from Docker Hub.
FROM node:21-alpine

# Step 1: Install Chromium for puppeteer
RUN apk add --no-cache chromium

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Step 2: setup User
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

# Step 3: Set the working directory inside the container to /app.
WORKDIR /app

# Step 4: Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache layers.
COPY --chown=node:node package*.json ./

# Step 4: Copy the rest of your application's code into the container.
COPY --chown=node:node . .

USER node

# Install Puppeteer under /node_modules so it's available system-wide
RUN npm install puppeteer

USER node

# Step 5: Install your application's dependencies.
# Use `npm ci` for production builds as it's faster and more reliable for CI/CD environments.
RUN npm install --only=production

# Step 6: Expose the port your app runs on. Adjust this if your app uses a different port.
EXPOSE 3000

# Step 7: Define the command to run your app. Adjust if your app starts differently.
CMD ["node", "server.js"]
