FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# Do not run the app's "prepare" lifecycle during image build: it initializes
# the datastore, which must be available at runtime, not while building.
RUN npm ci --omit=dev --ignore-scripts
COPY . .
EXPOSE 3000 3001
CMD ["npm","run","start"]
