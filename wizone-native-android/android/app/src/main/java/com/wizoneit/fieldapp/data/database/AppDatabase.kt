package com.wizoneit.fieldapp.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.wizoneit.fieldapp.data.database.dao.TaskDao
import com.wizoneit.fieldapp.data.database.dao.PendingUploadDao
import com.wizoneit.fieldapp.data.database.entity.TaskEntity
import com.wizoneit.fieldapp.data.database.entity.PendingUploadEntity
import com.wizoneit.fieldapp.data.database.converter.DateConverter

@Database(
    entities = [TaskEntity::class, PendingUploadEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(DateConverter::class)
abstract class AppDatabase : RoomDatabase() {
    
    abstract fun taskDao(): TaskDao
    abstract fun pendingUploadDao(): PendingUploadDao
    
    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null
        
        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "wizone_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}