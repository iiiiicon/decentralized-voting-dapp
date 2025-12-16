"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import VotingCard from "./components/voting/VotingCard";
import CreateVotingForm from "./components/voting/CreateVotingForm";
import { VotingInfo } from "./types/voting";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: allVotings, refetch } = useScaffoldContractRead({
    contractName: "VotingSystem",
    functionName: "getAllVotings",
  });

  const activeVotings = allVotings?.filter((v: VotingInfo) => 
    v.isActive && Number(v.endTime) * 1000 > Date.now()
  ) || [];

  const myVotings = allVotings?.filter((v: VotingInfo) => 
    v.creator.toLowerCase() === address?.toLowerCase()
  ) || [];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Навигация */}
      <div className="navbar bg-base-200">
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl">Голосование DApp</a>
        </div>
        <div className="navbar-end">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={!isConnected}
          >
            {showCreateForm ? "Отмена" : "Создать"}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Статистика */}
        <div className="stats shadow mb-8 w-full">
          <div className="stat">
            <div className="stat-title">Всего голосований</div>
            <div className="stat-value">{allVotings?.length || 0}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Активные</div>
            <div className="stat-value">{activeVotings.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Мои</div>
            <div className="stat-value">{myVotings.length}</div>
          </div>
        </div>

        {/* Форма создания */}
        {showCreateForm && (
          <div className="mb-8">
            <CreateVotingForm onSuccess={() => {
              setShowCreateForm(false);
              refetch();
            }} />
          </div>
        )}

        {/* Список голосований */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allVotings?.map((voting: VotingInfo) => (
            <VotingCard key={voting.id.toString()} voting={voting} />
          ))}
        </div>

        {(!allVotings || allVotings.length === 0) && (
          <div className="text-center py-12">
            <p className="text-lg">Нет голосований. Создайте первое!</p>
          </div>
        )}

        {!isConnected && (
          <div className="alert alert-warning mt-8">
            <span>Подключите кошелек для участия</span>
          </div>
        )}
      </div>
    </div>
  );
}