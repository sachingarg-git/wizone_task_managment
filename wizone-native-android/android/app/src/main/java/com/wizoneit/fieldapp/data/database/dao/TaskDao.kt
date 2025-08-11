package com.wizoneit.fieldapp.data.database.dao

import androidx.room.*
import com.wizoneit.fieldapp.data.database.entity.TaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    
    @Query("SELECT * FROM tasks ORDER BY lastModified DESC")
    fun getAllTasksFlow(): Flow<List<TaskEntity>>
    
    @Query("SELECT * FROM tasks ORDER BY lastModified DESC")
    suspend fun getAllTasks(): List<TaskEntity>
    
    @Query("SELECT * FROM tasks WHERE assignedTo = :engineerId ORDER BY lastModified DESC")
    suspend fun getTasksByEngineer(engineerId: String): List<TaskEntity>
    
    @Query("SELECT * FROM tasks WHERE id = :taskId")
    suspend fun getTaskById(taskId: Int): TaskEntity?
    
    @Query("SELECT * FROM tasks WHERE isSynced = 0")
    suspend fun getUnsyncedTasks(): List<TaskEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTasks(tasks: List<TaskEntity>)
    
    @Update
    suspend fun updateTask(task: TaskEntity)
    
    @Query("UPDATE tasks SET isSynced = 1 WHERE id = :taskId")
    suspend fun markTaskAsSynced(taskId: Int)
    
    @Query("UPDATE tasks SET isSynced = 0 WHERE id = :taskId")
    suspend fun markTaskAsUnsynced(taskId: Int)
    
    @Delete
    suspend fun deleteTask(task: TaskEntity)
    
    @Query("DELETE FROM tasks")
    suspend fun deleteAllTasks()
    
    @Query("SELECT COUNT(*) FROM tasks WHERE status = :status")
    suspend fun getTaskCountByStatus(status: String): Int
    
    @Query("SELECT COUNT(*) FROM tasks WHERE priority = 'high' AND status != 'completed' AND status != 'resolved'")
    suspend fun getHighPriorityTaskCount(): Int
}