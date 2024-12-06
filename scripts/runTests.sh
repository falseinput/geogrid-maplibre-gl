#!/bin/bash

# Variables
IMAGE_NAME="playwright-tests"
CONTAINER_NAME="playwright-container"
SCREENSHOTS_SOURCE="/app/tests/__screenshots__"
SCREENSHOTS_DESTINATION="./tests"
# Playwright report server port
EXPOSED_PORT=9323

# Functions
build_image() {
  echo "Building Docker image: $IMAGE_NAME..."
  docker build -t $IMAGE_NAME .
}

run_container() {
  echo "Starting container from image: $IMAGE_NAME..."
  CONTAINER_ID=$(docker run -d -p $EXPOSED_PORT:$EXPOSED_PORT --name $CONTAINER_NAME $IMAGE_NAME tail -f /dev/null)
  echo "Container started with ID: $CONTAINER_ID"
}

execute_tests() {
  if [ -z "$CI" ]; then
    TTY_FLAG="-it"
  else
    TTY_FLAG=""
  fi

  echo "Running Playwright tests..."
  docker exec $TTY_FLAG $CONTAINER_NAME npm run test
}

copy_screenshots() {
  echo "Copying screenshots from container..."
  mkdir -p "$SCREENSHOTS_DESTINATION"
  docker cp $CONTAINER_NAME:$SCREENSHOTS_SOURCE $SCREENSHOTS_DESTINATION
  echo "Screenshots copied to $SCREENSHOTS_DESTINATION"
}

clean_up() {
  echo "Cleaning up..."
  if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    docker stop $CONTAINER_NAME > /dev/null
    docker rm $CONTAINER_NAME > /dev/null
    echo "Container $CONTAINER_NAME removed."
  fi
  if [ "$(docker images -q $IMAGE_NAME)" ]; then
    docker rmi $IMAGE_NAME > /dev/null
    echo "Docker image $IMAGE_NAME removed."
  fi
}

# Ensure cleanup happens on exit
trap clean_up EXIT

# Main script execution
build_image
run_container
execute_tests
copy_screenshots

echo "Script completed successfully."
