package com.wizoneit.fieldapp.ui.tasks

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.wizoneit.fieldapp.WizoneApplication
import com.wizoneit.fieldapp.databinding.FragmentTaskListBinding
import com.wizoneit.fieldapp.ui.tasks.detail.TaskDetailActivity
import kotlinx.coroutines.launch

class TaskListFragment : Fragment() {
    
    private var _binding: FragmentTaskListBinding? = null
    private val binding get() = _binding!!
    
    private lateinit var taskAdapter: TaskListAdapter
    private lateinit var viewModel: TaskListViewModel
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTaskListBinding.inflate(inflater, container, false)
        return binding.root
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        val app = requireActivity().application as WizoneApplication
        viewModel = TaskListViewModel(app.taskRepository)
        
        setupRecyclerView()
        setupSwipeRefresh()
        observeViewModel()
        
        // Load initial data
        viewModel.loadTasks()
    }
    
    private fun setupRecyclerView() {
        taskAdapter = TaskListAdapter { task ->
            // Navigate to task detail
            val intent = Intent(requireContext(), TaskDetailActivity::class.java)
            intent.putExtra(TaskDetailActivity.EXTRA_TASK_ID, task.id)
            startActivity(intent)
        }
        
        binding.recyclerViewTasks.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = taskAdapter
        }
    }
    
    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setOnRefreshListener {
            viewModel.refreshTasks()
        }
    }
    
    private fun observeViewModel() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.tasks.collect { tasks ->
                taskAdapter.submitList(tasks)
                
                // Show/hide empty state
                if (tasks.isEmpty()) {
                    binding.recyclerViewTasks.visibility = View.GONE
                    binding.emptyStateLayout.visibility = View.VISIBLE
                } else {
                    binding.recyclerViewTasks.visibility = View.VISIBLE
                    binding.emptyStateLayout.visibility = View.GONE
                }
            }
        }
        
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.isLoading.collect { isLoading ->
                binding.swipeRefreshLayout.isRefreshing = isLoading
            }
        }
        
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.error.collect { error ->
                error?.let {
                    // Show error message
                    com.google.android.material.snackbar.Snackbar.make(
                        binding.root,
                        it,
                        com.google.android.material.snackbar.Snackbar.LENGTH_LONG
                    ).show()
                }
            }
        }
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}