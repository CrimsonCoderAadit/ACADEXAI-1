type TimeBlock = {
  id?: string;
  task: string;
  start: string;
  end: string;
  priority?: "high" | "medium" | "low";
  isClass?: boolean; // Marks if this is a class (immutable)
  completed?: boolean; // Marks if task is completed
};

const PRIORITY_STYLES = {
  high: "border-red-500 bg-red-500/10",
  medium: "border-yellow-500 bg-yellow-500/10",
  low: "border-green-500 bg-green-500/10",
};

// Completed task styling (gold/amber)
const COMPLETED_STYLE = "border-2 border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-900/30";

// Special styling for class blocks (always purple, never changes)
const CLASS_STYLE = "border-2 border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-900/30";


type Schedule = {
  days: Record<string, TimeBlock[]>;
};

// Format time to 12-hour with AM/PM
function formatTime(time: string): string {
  if (!time) return '';
  
  const match = time.match(/(\d{1,2}):?(\d{2})?/);
  if (!match) return time;
  
  let hours = parseInt(match[1]);
  const minutes = match[2] || '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  return `${hours}:${minutes} ${period}`;
}


export default function WeeklySchedule({
  schedule,
  onDelete,
  deleting,
  onToggleComplete
}: {
  schedule: Schedule;
  onDelete?: () => void;
  deleting?: boolean;
  onToggleComplete?: (day: string, blockIndex: number) => void;
}) {
  if (!schedule) return null;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Check if there are any user tasks (non-class tasks)
  const hasUserTasks = Object.values(schedule.days).some(blocks =>
    blocks.some(block => !block.isClass)
  );

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Your Weekly Schedule</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
              <span className="text-sm text-gray-400">
                <span className="font-semibold text-white">{Object.values(schedule.days).flat().length}</span> tasks scheduled
              </span>
            </div>

            {onDelete && hasUserTasks && (
              <button
                onClick={onDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? "Deleting..." : "Delete Schedule"}
              </button>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="w-3 h-3 bg-purple-500/40 border border-purple-500 rounded"></div>
            <span className="text-purple-300 font-medium">Classes (Immutable)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="w-3 h-3 bg-amber-500/40 border border-amber-500 rounded"></div>
            <span className="text-amber-300 font-medium">Completed</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="w-3 h-3 bg-red-500/40 border border-red-500 rounded"></div>
            <span className="text-red-300 font-medium">High Priority</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="w-3 h-3 bg-yellow-500/40 border border-yellow-500 rounded"></div>
            <span className="text-yellow-300 font-medium">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="w-3 h-3 bg-green-500/40 border border-green-500 rounded"></div>
            <span className="text-green-300 font-medium">Low Priority</span>
          </div>
        </div>
      </div>

      {/* Schedule Grid - 2 columns per row with horizontal scroll */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1400px] mx-auto">
        {daysOfWeek.map((day) => {
          const blocks = schedule.days[day] || [];
          const sortedBlocks = [...blocks].sort((a, b) => {
            const getMinutes = (time: string) => {
              if (!time) return 0;
              const match = time.match(/(\d{1,2}):?(\d{2})?/);
              if (!match) return 0;
              return parseInt(match[1]) * 60 + parseInt(match[2] || '0');
            };
            return getMinutes(a.start || '') - getMinutes(b.start || '');
          });

          return (
            <div
              key={day}
              className="bg-gradient-to-br from-gray-800 to-gray-850 border-2 border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 hover:shadow-2xl transition-all duration-200"
            >
              {/* Day Header - Fixed */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 border-b-2 border-gray-700">
                <h3 className="font-bold text-white text-xl uppercase tracking-wider">
                  {day}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  {sortedBlocks.length} {sortedBlocks.length === 1 ? 'task' : 'tasks'}
                </p>
              </div>

              {/* Tasks List - Scrollable */}
              <div className="p-5 max-h-[500px] overflow-y-auto">
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: #1f2937;
                    border-radius: 10px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: #4b5563;
                    border-radius: 10px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: #6b7280;
                  }
                `}</style>

                <div className="space-y-3">
                  {sortedBlocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <svg className="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">Free day</p>
                    </div>
                  ) : (
                    sortedBlocks.map((block, idx) => {
                      // Determine styling: Classes are always purple, completed tasks are amber, otherwise use priority
                      const getBlockStyle = () => {
                        if (block.isClass) return CLASS_STYLE;
                        if (block.completed) return COMPLETED_STYLE;
                        return PRIORITY_STYLES[block.priority ?? "medium"];
                      };

                      return (
                        <div
                          key={block.id || idx}
                          onClick={() => {
                            // Only allow toggling completion for non-class tasks
                            if (!block.isClass && onToggleComplete) {
                              onToggleComplete(day, idx);
                            }
                          }}
                          className={`rounded-xl border-2 p-4 transition-all hover:scale-[1.01] hover:shadow-xl relative backdrop-blur-sm
                            ${getBlockStyle()}
                            ${!block.isClass ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}
                          `}
                        >
                          {/* Class indicator icon */}
                          {block.isClass && (
                            <div className="absolute top-2 right-2 bg-purple-600/40 p-1.5 rounded-lg">
                              <svg className="w-4 h-4 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                            </div>
                          )}

                          {/* Completion checkmark for completed tasks */}
                          {block.completed && !block.isClass && (
                            <div className="absolute top-2 right-2 bg-amber-600/40 p-1.5 rounded-lg">
                              <svg className="w-4 h-4 text-amber-200" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}

                          <div className="pr-10">
                            <p className={`font-bold text-base mb-3 leading-snug text-white break-words ${block.completed && !block.isClass ? 'line-through opacity-75' : ''}`}>
                              {block.task}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-200 bg-black/30 px-3 py-2 rounded-lg w-fit">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="whitespace-nowrap">{formatTime(block.start)} - {formatTime(block.end)}</span>
                            </div>
                            {block.isClass && (
                              <div className="mt-2.5 inline-block">
                                <span className="text-xs font-bold text-purple-200 bg-purple-900/40 px-2.5 py-1 rounded-md">CLASS</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}