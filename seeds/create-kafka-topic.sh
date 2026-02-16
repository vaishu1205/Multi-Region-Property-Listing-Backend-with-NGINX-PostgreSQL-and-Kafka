#!/bin/bash

kafka-topics --create \
  --topic property-updates \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists