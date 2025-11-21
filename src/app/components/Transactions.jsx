
export default function Transactions() {
  const transactions = [
    {
      name: "Konnor Guzman",
      date: "Dec 21, 2021 - 08:05",
      amount: 660.22,
      type: "income",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Henry Curtis",
      date: "Dec 19, 2021 - 11:55",
      amount: 33.63,
      type: "income",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    },
    {
      name: "Derrick Simmons",
      date: "Dec 16, 2021 - 14:45",
      amount: 674.63,
      type: "expense",
      avatar: null, // fallback to initials
    },
    {
      name: "Kartina West",
      date: "Dec 13, 2021 - 11:30",
      amount: 547.63,
      type: "income",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
      name: "Samantha Shelton",
      date: "Dec 10, 2021 - 09:41",
      amount: 736.24,
      type: "income",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Joe Perkins",
      date: "Dec 06, 2021 - 11:41",
      amount: 369.6,
      type: "expense",
      avatar: null, // initials "JP"
    },
    {
      name: "John Parker",
      date: "Dec 09, 2021 - 23:20",
      amount: 231.0,
      type: "income",
      avatar: "https://randomuser.me/api/portraits/men/15.jpg",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 ">
      {/* Header */}
      <div className="flex justify-between px-1 items-center mb-4">
        <h2 className="text-gray-800 font-medium">Transactions</h2>
        <button className="text-blue-600 text-sm underline">
          View All
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {transactions.map((t, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-xl"
          >
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-3">
              {t.avatar ? (
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
              <div>
                <p className="text-gray-800 font-medium">{t.name}</p>
                <p className="text-sm text-gray-500">{t.date}</p>
              </div>
            </div>

            {/* Right: Amount */}
            <p
              className={`font-semibold ${
                t.type === "income" ? "text-green-600" : "text-red-500"
              }`}
            >
              ${t.amount.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
