# Step 1: Specify the base image. Here, we use the official Node.js image from Docker Hub.
FROM node:21-alpine

# Step 2: Install Chromium for puppeteer
RUN apk add --no-cache chromium
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Step 3: Setup User
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# Run everything after as non-privileged user.
USER pptruser

# Step 4: Set the working directory inside the container to /app.
WORKDIR /app

# Step 5: Copy package.json and package-lock.json (or yarn.lock) to leverage Docker cache layers.
# Ensure the user 'pptruser' owns the copied files.
COPY --chown=pptruser:pptruser package*.json ./

# Step 6: Copy the rest of your application's code into the container.
COPY --chown=pptruser:pptruser . .

# Step 7: Install your application's dependencies including Puppeteer.
# Use `npm ci` for production builds as it's faster and more reliable for CI/CD environments.
RUN npm install --only=production

# Step 8: Expose the port your app runs on. Adjust this if your app uses a different port.
EXPOSE 3000

# Step 9: Define the command to run your app. Adjust if your app starts differently.
CMD ["node", "server.js"]
