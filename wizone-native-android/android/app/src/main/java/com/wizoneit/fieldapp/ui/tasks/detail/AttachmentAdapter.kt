package com.wizoneit.fieldapp.ui.tasks.detail

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wizoneit.fieldapp.data.model.TaskAttachment
import com.wizoneit.fieldapp.databinding.ItemAttachmentBinding
import java.text.SimpleDateFormat
import java.util.*

class AttachmentAdapter(
    private val onAttachmentClick: (TaskAttachment) -> Unit
) : ListAdapter<TaskAttachment, AttachmentAdapter.AttachmentViewHolder>(AttachmentDiffCallback()) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AttachmentViewHolder {
        val binding = ItemAttachmentBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return AttachmentViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: AttachmentViewHolder, position: Int) {
        holder.bind(getItem(position))
    }
    
    inner class AttachmentViewHolder(
        private val binding: ItemAttachmentBinding
    ) : RecyclerView.ViewHolder(binding.root) {
        
        private val dateFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        
        fun bind(attachment: TaskAttachment) {
            binding.apply {
                tvFileName.text = attachment.fileName
                tvFileSize.text = formatFileSize(attachment.fileSize)
                tvUploadedBy.text = "Uploaded by: ${attachment.uploadedBy}"
                tvUploadedAt.text = dateFormat.format(attachment.createdAt)
                
                // Set appropriate icon based on file type
                val iconRes = when {
                    attachment.mimeType?.startsWith("image/") == true -> 
                        android.R.drawable.ic_menu_gallery
                    attachment.mimeType?.startsWith("video/") == true -> 
                        android.R.drawable.ic_menu_slideshow
                    else -> android.R.drawable.ic_menu_save
                }
                ivFileIcon.setImageResource(iconRes)
                
                root.setOnClickListener {
                    onAttachmentClick(attachment)
                }
            }
        }
        
        private fun formatFileSize(bytes: Long): String {
            val kb = bytes / 1024.0
            val mb = kb / 1024.0
            
            return when {
                mb >= 1 -> String.format("%.1f MB", mb)
                kb >= 1 -> String.format("%.1f KB", kb)
                else -> "$bytes bytes"
            }
        }
    }
}

class AttachmentDiffCallback : DiffUtil.ItemCallback<TaskAttachment>() {
    override fun areItemsTheSame(oldItem: TaskAttachment, newItem: TaskAttachment): Boolean {
        return oldItem.id == newItem.id
    }
    
    override fun areContentsTheSame(oldItem: TaskAttachment, newItem: TaskAttachment): Boolean {
        return oldItem == newItem
    }
}