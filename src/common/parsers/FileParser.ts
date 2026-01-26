import { DatabaseTable } from '../../domain/models/databaseModels.js';
import { SQLFileParser } from './SQLFileParser.js';
import { ModelFileParser } from './ModelFileParser.js';

/**
 * Parse different types of database files
 */
export class FileParser {
  private static sqlParser = new SQLFileParser();
  private static modelParser = new ModelFileParser();

  // Parse SQL migration files
  static async parseSQLFile(filePath: string): Promise<DatabaseTable[]> {
    return await this.sqlParser.parseSQLFile(filePath);
  }

  // Parse TypeScript/JavaScript model files (Sequelize, TypeORM, Prisma, etc.)
  static async parseModelFile(filePath: string): Promise<DatabaseTable[]> {
    return await this.modelParser.parseModelFile(filePath);
  }
}
