import { db } from "./db";
import { users, attendance, type User, type InsertUser, type Attendance, type InsertAttendance } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createAttendance(record: InsertAttendance): Promise<Attendance>;
  getAttendanceRecords(): Promise<(Attendance & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createAttendance(record: InsertAttendance): Promise<Attendance> {
    const [entry] = await db.insert(attendance).values(record).returning();
    return entry;
  }

  async getAttendanceRecords(): Promise<(Attendance & { user: User })[]> {
    const records = await db
      .select()
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .orderBy(desc(attendance.timestamp));
      
    // Map to structure expected by frontend if needed, but innerJoin returns { attendance: ..., users: ... }
    // Drizzle join result is an array of objects like { attendance: Attendance, users: User }
    // We need to map it to Attendance & { user: User }
    
    return records.map(({ attendance, users }) => ({
      ...attendance,
      user: users,
    }));
  }
}

export const storage = new DatabaseStorage();
