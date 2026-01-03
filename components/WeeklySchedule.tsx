type TimeBlock = {
  id?: string;
  task: string;
  start: string;
  end: string;
  priority?: "high" | "medium" | "low";
  isClass?: boolean; // Marks if this is a class (immutable)
};

const PRIORITY_STYLES = {
  high: "border-red-500 bg-red-500/10",
  medium: "border-yellow-500 bg-yellow-500/10",
  low: "border-green-500 bg-green-500/10",
};

// Special styling for class blocks
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
  deleting
}: {
  schedule: Schedule;
  onDelete?: () => void;
  deleting?: boolean;
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

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 ">
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
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-[280px] flex flex-col hover:border-gray-600 transition-colors"
            >
              {/* Day Header */}
              <div className="text-center mb-4 pb-3 border-b border-gray-700">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                  {day.slice(0, 3)}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {sortedBlocks.length} {sortedBlocks.length === 1 ? 'task' : 'tasks'}
                </p>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 ">
                {sortedBlocks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 ">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Free day</p>
                  </div>
                ) : (
                  sortedBlocks.map((block, idx) => (
                    <div
                      key={block.id || idx}
                      className={`rounded-lg border-2 p-3 transition-all hover:scale-105 hover:shadow-lg relative
                        ${block.isClass ? CLASS_STYLE : PRIORITY_STYLES[block.priority ?? "medium"]}
                      `}

                    >
                      {block.isClass && (
                        <div className="absolute top-1 right-1">
                          <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                        </div>
                      )}
                      <p className="font-semibold text-sm mb-2 leading-tight text-white">
                        {block.task}
                        {block.isClass && <span className="ml-1 text-xs text-purple-300">(Class)</span>}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(block.start)} - {formatTime(block.end)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}