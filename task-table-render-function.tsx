// Helper function to render task table - paste this into tasks.tsx

const renderTaskTable = (filteredTasks: any[], sectionTitle: string, emptyMessage: string) => {
  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task ID</TableHead>
            <TableHead>
              <div className="flex flex-col gap-1">
                <span>Customer</span>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {getUniqueCustomers().map((customer) => (
                      <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex flex-col gap-1">
                <span>Issue Type</span>
                <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getUniqueIssueTypes().map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>
              <div className="flex flex-col gap-1">
                <span>Assigned To</span>
                <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    <SelectItem value="not_assigned">Not assigned</SelectItem>
                    {getUniqueAssignees().map((assignee) => (
                      <SelectItem key={assignee} value={assignee}>
                        {assignee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex flex-col gap-1">
                <span>Field Engineer</span>
                <Select value={fieldEngineerFilter} onValueChange={setFieldEngineerFilter}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Engineers</SelectItem>
                    <SelectItem value="not_assigned">Not assigned</SelectItem>
                    {getUniqueFieldEngineers().map((engineer) => (
                      <SelectItem key={engineer} value={engineer}>
                        {engineer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex flex-col gap-1">
                <span>Status</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map((task: any) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <button
                  onClick={() => handleTaskIdClick(task)}
                  className="text-primary hover:text-primary/80 underline hover:no-underline font-medium flex items-center gap-1"
                >
                  {task.ticketNumber}
                  {task.title && (task.title.includes('_2') || task.title.includes('_3') || task.title.includes('_4') || task.title.includes('_5') || task.title.includes('_6') || task.title.includes('_7') || task.title.includes('_8') || task.title.includes('_9')) && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-orange-500 rounded-full">
                      D
                    </span>
                  )}
                </button>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {Array.isArray(task.customerName) 
                      ? task.customerName[0] || 'Unknown Customer'
                      : task.customerName || 'Unknown Customer'
                    }
                  </div>
                  <div className="text-sm text-gray-500">{task.customer?.city}</div>
                </div>
              </TableCell>
              <TableCell>{task.category}</TableCell>
              <TableCell>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.assignedUser?.firstName} {task.assignedUser?.lastName}
              </TableCell>
              <TableCell>
                {task.fieldEngineer ? (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-600">
                      {task.fieldEngineer.firstName} {task.fieldEngineer.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Not assigned</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(task.status)}>
                  {task.status?.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm font-medium">{formatDateTime(task.createdAt)}</div>
                  <div className="text-xs text-gray-500">
                    by {task.createdByUser?.firstName || 'System'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{calculateDuration(task)}</div>
                  {task.status === 'completed' && task.createdByUser && (
                    <div className="text-xs text-gray-500">
                      Resolved by {task.createdByUser.firstName}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {shouldShowAssignmentButtons(task) && backendEngineers && (
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleQuickAssign(task.id, currentUser?.id)}
                        title="Assign to Me"
                        className="text-xs px-2 py-1"
                        disabled={!currentUser?.id}
                      >
                        Assign to Me
                      </Button>
                      <Select onValueChange={(userId) => handleQuickAssign(task.id, userId)}>
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue placeholder="Backend Eng." />
                        </SelectTrigger>
                        <SelectContent>
                          {backendEngineers?.map((engineer: any) => (
                            <SelectItem key={engineer.id} value={engineer.id}>
                              {engineer.firstName} {engineer.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewTask(task.id)}
                    title="View Task"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditTask(task.id)}
                    title="Edit Task"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {currentUser?.role === 'admin' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTask(task.id, task.ticketNumber)}
                      title="Delete Task"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
