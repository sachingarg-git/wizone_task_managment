package com.wizoneit.fieldapp.ui.tasks

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wizoneit.fieldapp.R
import com.wizoneit.fieldapp.data.model.Task
import com.wizoneit.fieldapp.databinding.ItemTaskBinding
import java.text.SimpleDateFormat
import java.util.*

class TaskListAdapter(
    private val onTaskClick: (Task) -> Unit
) : ListAdapter<Task, TaskListAdapter.TaskViewHolder>(TaskDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TaskViewHolder {
        val binding = ItemTaskBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return TaskViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: TaskViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class TaskViewHolder(
        private val binding: ItemTaskBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        private val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        
        fun bind(task: Task) {
            binding.apply {
                // Task basic info
                tvTaskId.text = task.ticketNumber
                tvTaskTitle.text = task.title
                tvCustomerName.text = task.customerName ?: "No Customer"
                tvDescription.text = task.description ?: ""
                
                // Issue type
                tvIssueType.text = task.issueType ?: "General"
                
                // Assigned engineer
                val assignedName = if (task.assignedUser != null) {
                    "${task.assignedUser.firstName ?: ""} ${task.assignedUser.lastName ?: ""}".trim()
                } else {
                    "Unassigned"
                }
                tvAssignedTo.text = assignedName
                
                // Status badge
                tvStatus.text = task.status.replace("_", " ").uppercase()
                tvStatus.background = ContextCompat.getDrawable(
                    itemView.context,
                    getStatusBackground(task.status)
                )
                
                // Priority badge
                tvPriority.text = task.priority.uppercase()
                tvPriority.background = ContextCompat.getDrawable(
                    itemView.context,
                    getPriorityBackground(task.priority)
                )
                
                // Created date
                tvCreatedAt.text = "Created: ${dateFormat.format(task.createdAt)}"
                
                // Updated date
                tvUpdatedAt.text = "Updated: ${dateFormat.format(task.updatedAt)}"
                
                // Click listener
                root.setOnClickListener {
                    onTaskClick(task)
                }
                
                // Show indicator if task is not synced (assuming you have this field)
                // iconSync.visibility = if (task.isSynced != false) View.GONE else View.VISIBLE
            }
        }
        
        private fun getStatusBackground(status: String): Int {
            return when (status.lowercase()) {
                "pending" -> R.drawable.bg_status_pending
                "in_progress" -> R.drawable.bg_status_in_progress
                "completed", "resolved" -> R.drawable.bg_status_completed
                "cancelled" -> R.drawable.bg_status_cancelled
                else -> R.drawable.bg_status_default
            }
        }
        
        private fun getPriorityBackground(priority: String): Int {
            return when (priority.lowercase()) {
                "high" -> R.drawable.bg_priority_high
                "medium" -> R.drawable.bg_priority_medium
                "low" -> R.drawable.bg_priority_low
                else -> R.drawable.bg_priority_default
            }
        }
    }
}

class TaskDiffCallback : DiffUtil.ItemCallback<Task>() {
    override fun areItemsTheSame(oldItem: Task, newItem: Task): Boolean {
        return oldItem.id == newItem.id
    }
    
    override fun areContentsTheSame(oldItem: Task, newItem: Task): Boolean {
        return oldItem == newItem
    }
}