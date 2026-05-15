#!/bin/bash

# BloodLink Docker Helper Script
# Usage: ./docker-helper.sh [command]

set -e

COMPOSE_CMD="docker-compose"

case "${1:-help}" in
  start)
    echo "Starting BloodLink services..."
    $COMPOSE_CMD up -d
    echo "✓ Services started. Backend: http://localhost:8000"
    ;;
  
  stop)
    echo "Stopping BloodLink services..."
    $COMPOSE_CMD stop
    echo "✓ Services stopped"
    ;;
  
  restart)
    echo "Restarting BloodLink services..."
    $COMPOSE_CMD restart
    echo "✓ Services restarted"
    ;;
  
  reset)
    echo "WARNING: This will delete all database data!"
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      $COMPOSE_CMD down -v
      echo "✓ Containers and volumes removed"
      $COMPOSE_CMD up -d
      echo "✓ Services started with fresh database"
    else
      echo "Reset cancelled"
    fi
    ;;
  
  logs)
    $COMPOSE_CMD logs -f "${2:-php}"
    ;;
  
  db)
    $COMPOSE_CMD exec postgres psql -U postgres -d bloodlink
    ;;
  
  shell)
    $COMPOSE_CMD exec php bash
    ;;
  
  status)
    $COMPOSE_CMD ps
    ;;
  
  build)
    echo "Building Docker image..."
    $COMPOSE_CMD build --no-cache
    echo "✓ Image built successfully"
    ;;
  
  down)
    $COMPOSE_CMD down
    echo "✓ Containers removed"
    ;;
  
  *)
    echo "BloodLink Docker Helper"
    echo ""
    echo "Usage: ./docker-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start      - Start all services"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  reset      - Reset database and restart (WARNING: deletes data)"
    echo "  logs       - Show logs (optionally: logs php|postgres)"
    echo "  db         - Connect to PostgreSQL CLI"
    echo "  shell      - Open bash shell in PHP container"
    echo "  status     - Show container status"
    echo "  build      - Rebuild Docker image"
    echo "  down       - Remove all containers"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-helper.sh start"
    echo "  ./docker-helper.sh logs php"
    echo "  ./docker-helper.sh db"
    ;;
esac
