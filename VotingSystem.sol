// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract VotingSystem {
    // Структура голосования
    struct Voting {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
        Candidate[] candidates;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voterToCandidate; // для отслеживания выбора
    }

    // Структура кандидата
    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
    }

    // Маппинг голосований
    mapping(uint256 => Voting) public votings;
    uint256 public votingCount;
    
    // События
    event VotingCreated(
        uint256 indexed votingId,
        string title,
        address creator,
        uint256 startTime,
        uint256 endTime
    );
    
    event Voted(
        uint256 indexed votingId,
        address indexed voter,
        uint256 candidateId,
        uint256 timestamp
    );
    
    event VotingEnded(uint256 indexed votingId, uint256 timestamp);
    event VotingStatusChanged(uint256 indexed votingId, bool isActive);

    // Модификаторы
    modifier onlyVotingCreator(uint256 _votingId) {
        require(votings[_votingId].creator == msg.sender, "Not the voting creator");
        _;
    }
    
    modifier votingExists(uint256 _votingId) {
        require(_votingId > 0 && _votingId <= votingCount, "Voting does not exist");
        _;
    }
    
    modifier isActive(uint256 _votingId) {
        require(votings[_votingId].isActive, "Voting is not active");
        _;
    }

    // Создание нового голосования
    function createVoting(
        string memory _title,
        string memory _description,
        string[] memory _candidateNames,
        string[] memory _candidateDescriptions,
        uint256 _durationInMinutes
    ) public returns (uint256) {
        require(_candidateNames.length > 0, "At least one candidate required");
        require(_candidateNames.length == _candidateDescriptions.length, "Arrays length mismatch");
        require(_durationInMinutes > 0, "Duration must be positive");

        votingCount++;
        uint256 newVotingId = votingCount;
        
        Voting storage newVoting = votings[newVotingId];
        newVoting.id = newVotingId;
        newVoting.title = _title;
        newVoting.description = _description;
        newVoting.creator = msg.sender;
        newVoting.startTime = block.timestamp;
        newVoting.endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        newVoting.isActive = true;
        newVoting.totalVotes = 0;

        // Добавляем кандидатов
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            newVoting.candidates.push(Candidate({
                id: i,
                name: _candidateNames[i],
                description: _candidateDescriptions[i],
                voteCount: 0
            }));
        }

        emit VotingCreated(newVotingId, _title, msg.sender, newVoting.startTime, newVoting.endTime);
        return newVotingId;
    }

    // Голосование
    function vote(uint256 _votingId, uint256 _candidateId) 
        public 
        votingExists(_votingId)
        isActive(_votingId)
    {
        Voting storage currentVoting = votings[_votingId];
        
        // Проверка времени
        require(block.timestamp >= currentVoting.startTime, "Voting not started yet");
        require(block.timestamp <= currentVoting.endTime, "Voting has ended");
        
        // Проверка, что пользователь еще не голосовал
        require(!currentVoting.hasVoted[msg.sender], "Already voted");
        
        // Проверка валидности кандидата
        require(_candidateId < currentVoting.candidates.length, "Invalid candidate");

        // Голосуем
        currentVoting.hasVoted[msg.sender] = true;
        currentVoting.voterToCandidate[msg.sender] = _candidateId;
        currentVoting.candidates[_candidateId].voteCount++;
        currentVoting.totalVotes++;

        emit Voted(_votingId, msg.sender, _candidateId, block.timestamp);

        // Автоматическое завершение если время вышло
        if (block.timestamp > currentVoting.endTime) {
            _endVoting(_votingId);
        }
    }

    // Получение информации о голосовании
    function getVotingInfo(uint256 _votingId) 
        public 
        view 
        votingExists(_votingId)
        returns (
            string memory title,
            string memory description,
            address creator,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            uint256 totalVotes,
            uint256 candidateCount,
            uint256 timeRemaining
        )
    {
        Voting storage v = votings[_votingId];
        uint256 remaining = 0;
        if (block.timestamp < v.endTime && v.isActive) {
            remaining = v.endTime - block.timestamp;
        }
        
        return (
            v.title,
            v.description,
            v.creator,
            v.startTime,
            v.endTime,
            v.isActive,
            v.totalVotes,
            v.candidates.length,
            remaining
        );
    }

    // Получение кандидатов голосования
    function getCandidates(uint256 _votingId) 
        public 
        view 
        votingExists(_votingId)
        returns (Candidate[] memory)
    {
        return votings[_votingId].candidates;
    }

    // Получение результатов
    function getResults(uint256 _votingId) 
        public 
        view 
        votingExists(_votingId)
        returns (Candidate[] memory, uint256 winningCandidateId)
    {
        Voting storage v = votings[_votingId];
        uint256 maxVotes = 0;
        uint256 winnerId = 0;
        
        for (uint256 i = 0; i < v.candidates.length; i++) {
            if (v.candidates[i].voteCount > maxVotes) {
                maxVotes = v.candidates[i].voteCount;
                winnerId = i;
            }
        }
        
        return (v.candidates, winnerId);
    }

    // Проверка, голосовал ли пользователь
    function hasUserVoted(uint256 _votingId, address _user) 
        public 
        view 
        votingExists(_votingId)
        returns (bool)
    {
        return votings[_votingId].hasVoted[_user];
    }

    // Завершение голосования (только создатель или по времени)
    function endVoting(uint256 _votingId) 
        public 
        votingExists(_votingId)
        onlyVotingCreator(_votingId)
    {
        _endVoting(_votingId);
    }

    // Внутренняя функция завершения
    function _endVoting(uint256 _votingId) internal {
        require(votings[_votingId].isActive, "Already ended");
        votings[_votingId].isActive = false;
        emit VotingEnded(_votingId, block.timestamp);
    }

    // Получение списка всех голосований
    function getAllVotings() public view returns (VotingInfo[] memory) {
        VotingInfo[] memory allVotings = new VotingInfo[](votingCount);
        
        for (uint256 i = 1; i <= votingCount; i++) {
            Voting storage v = votings[i];
            allVotings[i-1] = VotingInfo({
                id: v.id,
                title: v.title,
                creator: v.creator,
                startTime: v.startTime,
                endTime: v.endTime,
                isActive: v.isActive,
                totalVotes: v.totalVotes,
                candidateCount: v.candidates.length
            });
        }
        
        return allVotings;
    }

    // Вспомогательная структура для возврата
    struct VotingInfo {
        uint256 id;
        string title;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
        uint256 candidateCount;
    }
}