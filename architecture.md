# Architecture

## Layers

Frontend
↓
API Layer
↓
Service Layer
↓
Repository/Data Layer
↓
Database

## Processing Pipeline

Receipt
↓
Image Preprocessing
↓
OCR
↓
Raw Text
↓
Transaction Parser
↓
Normalized Transaction
↓
Merchant Detection
↓
Category Prediction
↓
User Confirmation
↓
Database

## Priority of Category Decisions

1. User manual selection
2. User merchant preference
3. Known merchant rules
4. Keyword rules
5. AI prediction
6. Uncategorized