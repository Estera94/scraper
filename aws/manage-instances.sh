#!/bin/bash

# Script to manage EC2 instances for website-scraper
# Ensures only one instance is running at any time

set -e

REGION="us-east-1"
APP_NAME="website-scraper"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

case "${1:-list}" in
    list)
        print_info "Listing all instances for $APP_NAME..."
        aws ec2 describe-instances \
            --region $REGION \
            --filters "Name=tag:Name,Values=$APP_NAME" \
            --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,LaunchTime]' \
            --output table
        ;;
    
    status)
        RUNNING=$(aws ec2 describe-instances \
            --region $REGION \
            --filters "Name=tag:Name,Values=$APP_NAME" "Name=instance-state-name,Values=running" \
            --query 'Reservations[*].Instances[*].InstanceId' \
            --output text)
        
        if [ -z "$RUNNING" ]; then
            print_warn "No running instances found."
        else
            COUNT=$(echo "$RUNNING" | wc -w | tr -d ' ')
            if [ "$COUNT" -eq 1 ]; then
                print_info "✓ Only one instance is running: $RUNNING"
                IP=$(aws ec2 describe-instances \
                    --region $REGION \
                    --instance-ids $RUNNING \
                    --query 'Reservations[0].Instances[0].PublicIpAddress' \
                    --output text)
                print_info "  Public IP: $IP"
            else
                print_warn "⚠ Multiple instances running ($COUNT):"
                echo "$RUNNING" | tr '\t' '\n' | while read INSTANCE; do
                    echo "  - $INSTANCE"
                done
            fi
        fi
        ;;
    
    cleanup)
        print_info "Cleaning up extra instances..."
        RUNNING=$(aws ec2 describe-instances \
            --region $REGION \
            --filters "Name=tag:Name,Values=$APP_NAME" "Name=instance-state-name,Values=running" \
            --query 'Reservations[*].Instances[*].[InstanceId,LaunchTime]' \
            --output text | sort -k2 | head -1 | cut -f1)
        
        if [ -z "$RUNNING" ]; then
            print_warn "No running instances found."
            exit 0
        fi
        
        print_info "Keeping newest instance: $RUNNING"
        
        ALL_INSTANCES=$(aws ec2 describe-instances \
            --region $REGION \
            --filters "Name=tag:Name,Values=$APP_NAME" "Name=instance-state-name,Values=running" \
            --query 'Reservations[*].Instances[*].InstanceId' \
            --output text)
        
        TERMINATED=0
        for INSTANCE in $ALL_INSTANCES; do
            if [ "$INSTANCE" != "$RUNNING" ]; then
                print_info "Terminating instance: $INSTANCE"
                aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE > /dev/null
                TERMINATED=$((TERMINATED + 1))
            fi
        done
        
        if [ $TERMINATED -eq 0 ]; then
            print_info "No extra instances to terminate. Only one instance is running."
        else
            print_info "Terminated $TERMINATED instance(s). Waiting for termination..."
            sleep 5
        fi
        ;;
    
    terminate-all)
        print_warn "Terminating ALL instances for $APP_NAME..."
        ALL_INSTANCES=$(aws ec2 describe-instances \
            --region $REGION \
            --filters "Name=tag:Name,Values=$APP_NAME" "Name=instance-state-name,Values=running,pending,stopping" \
            --query 'Reservations[*].Instances[*].InstanceId' \
            --output text)
        
        if [ -z "$ALL_INSTANCES" ]; then
            print_info "No instances to terminate."
            exit 0
        fi
        
        for INSTANCE in $ALL_INSTANCES; do
            print_info "Terminating instance: $INSTANCE"
            aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE > /dev/null
        done
        
        print_info "All instances terminated."
        ;;
    
    *)
        echo "Usage: $0 {list|status|cleanup|terminate-all}"
        echo ""
        echo "Commands:"
        echo "  list         - List all instances"
        echo "  status       - Check if only one instance is running"
        echo "  cleanup      - Terminate extra instances, keep newest"
        echo "  terminate-all - Terminate all instances"
        exit 1
        ;;
esac

