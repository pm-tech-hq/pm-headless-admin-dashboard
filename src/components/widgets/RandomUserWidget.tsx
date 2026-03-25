"use client";

import React, { useEffect, useState } from "react";

interface RandomUser {
  gender: string;
  name: { title: string; first: string; last: string };
  location: { city: string; country: string };
  email: string;
  dob: { age: number };
  picture: { large: string; medium: string };
  nat: string;
}

interface RandomUserResponse {
  results: RandomUser[];
}

type CountOption = 1 | 3 | 6;

export default function RandomUserWidget() {
  const [count, setCount] = useState<CountOption>(3);
  const [users, setUsers] = useState<RandomUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (n: CountOption) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://randomuser.me/api/?results=${n}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RandomUserResponse = await res.json();
      setUsers(json.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(count);
  }, [count]);

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5 bg-neutral-100 rounded-lg p-0.5">
          {([1, 3, 6] as CountOption[]).map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`text-[11px] px-3 py-1 rounded-md font-medium transition-all ${
                count === n
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={() => fetchUsers(count)}
          className="text-[10px] px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-all font-medium"
        >
          ↻ Refresh
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading users...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && (
        <div
          className={`flex-1 overflow-auto ${
            count === 1 ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2 content-start"
          }`}
        >
          {users.map((user, i) => (
            <div
              key={i}
              className={`border border-neutral-100 rounded-xl p-2.5 hover:border-neutral-200 hover:shadow-sm transition-all bg-neutral-50 ${
                count === 1 ? "flex items-center gap-4" : "flex flex-col items-center text-center"
              }`}
            >
              <img
                src={user.picture.medium}
                alt={`${user.name.first} ${user.name.last}`}
                className={`rounded-full border-2 border-white shadow-sm flex-shrink-0 ${
                  count === 1 ? "w-14 h-14" : "w-12 h-12 mb-1.5"
                }`}
              />
              <div className={count === 1 ? "flex-1 min-w-0" : ""}>
                <p className="text-[11px] font-semibold text-neutral-800">
                  {user.name.title} {user.name.first} {user.name.last}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Age {user.dob.age} · {user.nat}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {user.location.city}, {user.location.country}
                </p>
                <p className={`text-[10px] text-neutral-400 mt-0.5 ${count !== 1 ? "hidden" : ""}`}>
                  {user.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
