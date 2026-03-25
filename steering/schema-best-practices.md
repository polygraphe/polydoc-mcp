# Database Schema Best Practices for Polydoc

## Overview

When working with database models, entities, or schemas in a project that uses Polydoc, follow these practices to ensure clean documentation generation and maintainable schema design.

## Framework-Specific Guidance

### TypeORM

- Use the `@Entity('table_name')` decorator with an explicit table name
- Annotate all columns with `@Column()` including type and constraint options
- Define relationships explicitly with `@OneToMany`, `@ManyToOne`, `@ManyToMany`
- Place entity files in a dedicated `entities/` directory for reliable auto-detection

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts: Post[];
}
```

### Sequelize

- Use `sequelize.define()` or class-based model definitions
- Specify `DataTypes` explicitly for all fields
- Define associations in a separate `associate` method or file
- Place model files in a `models/` directory

### Prisma

- Keep your `schema.prisma` file at the project root or in `prisma/`
- Use `@relation` directives to make relationships explicit
- Add `@@map` for custom table names if they differ from model names

### Raw SQL Migrations

- Use `CREATE TABLE` statements with explicit column types and constraints
- Name migration files with timestamps or sequential numbers for ordering
- Include `FOREIGN KEY` constraints inline or as separate `ALTER TABLE` statements
- Place migrations in a `migrations/` directory

## General Recommendations

- Keep database-related files in standard directories (`entities/`, `models/`, `migrations/`)
- Use consistent naming conventions across your schema
- Document table purposes using `knownTables` parameter when generating docs
- Include index definitions alongside table definitions
- Define foreign key relationships explicitly rather than relying on conventions

## Improving Documentation Quality

To get the best output from Polydoc:

1. Use explicit type annotations in your ORM decorators/definitions
2. Define relationships bidirectionally when possible
3. Add constraints (unique, not null, default values) to your column definitions
4. Provide table descriptions via the `knownTables` parameter:
   ```json
   {
     "knownTables": {
       "users": "Core user accounts with authentication data",
       "orders": "Customer purchase orders with status tracking"
     }
   }
   ```
5. Use `includePatterns` for any non-standard file locations
