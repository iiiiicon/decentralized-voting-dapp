"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { VotingInfo } from "../types/voting";
import { Address } from "~~/components/scaffold-eth";

interface VotingCardProps {
  voting: VotingInfo;
}

export default function VotingCard({ voting }: VotingCardProps) {
  const { address } = useAccount();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [showCandidates, setShowCandidates] = useState(false);

  const { data: candidates } = useScaffoldContractRead({
    contractName: "VotingSystem",
    functionName: "getCandidates",
    args: [voting.id],
    enabled: showCandidates,
  });

  const { data: hasVoted } = useScaffoldContractRead({
    contractName: "VotingSystem",
    functionName: "hasUserVoted",
    args: [voting.id, address],
  });

  const { writeAsync: vote } = useScaffoldContractWrite({
    contractName: "VotingSystem",
    functionName: "vote",
    args: [voting.id, selectedCandidate],
  });

  const isActive = voting.isActive && Number(voting.endTime) * 1000 > Date.now();

  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const handleVote = async () => {
    if (selectedCandidate === null) return;
    try {
      await vote();
      alert("Голос успешно учтен!");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">{voting.title}</h2>
        <p>{voting.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Создатель</p>
            <Address address={voting.creator} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Проголосовало</p>
            <p>{voting.totalVotes.toString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Начало</p>
            <p>{formatTime(voting.startTime)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Окончание</p>
            <p>{formatTime(voting.endTime)}</p>
          </div>
        </div>

        <div className="card-actions justify-between mt-4">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowCandidates(!showCandidates)}
          >
            {showCandidates ? "Скрыть" : "Кандидаты"}
          </button>

          {isActive && address && !hasVoted && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => (document.getElementById(`modal-${voting.id}`) as any)?.showModal()}
            >
              Голосовать
            </button>
          )}

          {hasVoted && (
            <span className="badge badge-success">Вы проголосовали</span>
          )}
        </div>

        {showCandidates && candidates && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-bold mb-2">Кандидаты:</h3>
            {candidates.map((candidate: any, index: number) => (
              <div key={index} className="mb-2 p-2 bg-base-200 rounded">
                <div className="flex justify-between">
                  <span>{candidate.name}</span>
                  <span>{candidate.voteCount.toString()} голосов</span>
                </div>
                <p className="text-sm text-gray-600">{candidate.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <dialog id={`modal-${voting.id}`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Выберите кандидата</h3>
          <div className="space-y-2 mt-4">
            {candidates?.map((candidate: any, index: number) => (
              <div 
                key={index}
                className={`p-3 rounded cursor-pointer ${selectedCandidate === index ? 'bg-primary text-primary-content' : 'bg-base-200'}`}
                onClick={() => setSelectedCandidate(index)}
              >
                {candidate.name}
              </div>
            ))}
          </div>
          <div className="modal-action">
            <button className="btn" onClick={() => (document.getElementById(`modal-${voting.id}`) as any)?.close()}>
              Отмена
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                handleVote();
                (document.getElementById(`modal-${voting.id}`) as any)?.close();
              }}
              disabled={selectedCandidate === null}
            >
              Подтвердить
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}