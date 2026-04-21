

const activities = [
  {
    color: 'bg-gray-300',
    title: 'User Photo Changed',
    time: '4 hours ago',
    description: 'John Doe changed his avatar photo',
  },
  {
    color: 'bg-blue-500',
    title: 'Video Added',
    time: '6 hours ago',
    description: 'Mores Clarke added new video',
  },
  {
    color: 'bg-green-500',
    title: 'Design Completed',
    time: '7 hours ago',
    description: 'Robert Nolan completed the design of the CRM application',
  },
  {
    color: 'bg-orange-400',
    title: 'ER Diagram',
    time: 'a day ago',
    description: 'Team completed the ER diagram app',
  },
  {
    color: 'bg-red-500',
    title: 'Weekly Report',
    time: '2 days ago',
    description: 'The weekly report was uploaded',
  },
];

export default function TeamActivity() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Team Activity</h2>
        <a href="#" className="text-sm text-blue-500 underline">
          View All
        </a>
      </div>
      <div className="relative border-gray-200 pl-2">
        {activities.map((activity, index) => (
          <div key={index} className="mb-8 last:mb-0 relative">
           
            <span
              className={`absolute -left-3 flex items-center justify-center w-5 h-5 rounded-full ${activity.color} ring-4 ring-white`}
            ></span>
            <div className='ml-6'>
            <h3 className="font-medium text-gray-800">{activity.title}</h3>
            <p className="text-sm text-gray-400">{activity.time}</p>
            <p className="text-sm text-gray-600">{activity.description}</p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
