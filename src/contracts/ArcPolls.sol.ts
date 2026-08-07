export const SOLIDITY_CONTRACT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcPollsAndFeedback - Opinião Recompensada dApp
 * @dev On-chain decentralized poll & feedback system deployed on Arc Testnet.
 * Rewards voters instantly with USDC micro-rewards upon casting verified votes.
 * Native Network: Arc Testnet (Chain ID 5042002)
 * Native USDC ERC20 / Native Currency: 0x3600000000000000000000000000000000000000
 * Trusted Forwarder: 0x71Be63FCC4540be48F49bA3371CA0670355f3068
 */

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ArcPollsAndFeedback {
    address public immutable usdcToken;
    address public immutable trustedForwarder;
    uint256 public pollCounter;

    struct Option {
        string text;
        uint256 voteCount;
    }

    struct Poll {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 rewardPoolTotal;   // In micro-units (e.g. 6 decimals for USDC)
        uint256 rewardPerVote;    // USDC per valid voter
        uint256 maxParticipants;  // Maximum voters allowed
        uint256 claimedCount;     // Current voters count
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
        bool mintBadge;
    }

    // pollId => Poll
    mapping(uint256 => Poll) public polls;
    // pollId => Option[]
    mapping(uint256 => Option[]) public pollOptions;
    // pollId => voter address => hasVoted boolean
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    // pollId => array of voter records
    mapping(uint256 => address[]) public pollVoters;

    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        string title,
        uint256 rewardPoolTotal,
        uint256 maxParticipants,
        uint256 expiresAt
    );

    event VoteCast(
        uint256 indexed pollId,
        address indexed voter,
        uint256 indexed optionIndex,
        uint256 rewardDistributed
    );

    event PollClosed(uint256 indexed pollId, uint256 remainingRefunded);

    constructor(address _usdcToken, address _trustedForwarder) {
        usdcToken = _usdcToken;
        trustedForwarder = _trustedForwarder;
    }

    /**
     * @dev Creates a new poll with an attached USDC reward pool.
     */
    function createPoll(
        string memory _title,
        string memory _description,
        string[] memory _optionTexts,
        uint256 _rewardPoolTotal,
        uint256 _maxParticipants,
        uint256 _durationDays,
        bool _mintBadge
    ) external returns (uint256) {
        require(_optionTexts.length >= 2, "Must provide at least 2 options");
        require(_maxParticipants > 0, "Max participants must be > 0");
        require(_rewardPoolTotal > 0, "Reward pool must be > 0");

        // Deposit reward pool into contract escrow (or native currency handling)
        if (usdcToken != address(0)) {
            require(
                IERC20(usdcToken).transferFrom(msg.sender, address(this), _rewardPoolTotal),
                "USDC Escrow transfer failed"
            );
        }

        pollCounter++;
        uint256 newPollId = pollCounter;
        uint256 rewardPerVote = _rewardPoolTotal / _maxParticipants;
        uint256 expiresAt = block.timestamp + (_durationDays * 1 days);

        Poll storage p = polls[newPollId];
        p.id = newPollId;
        p.creator = msg.sender;
        p.title = _title;
        p.description = _description;
        p.rewardPoolTotal = _rewardPoolTotal;
        p.rewardPerVote = rewardPerVote;
        p.maxParticipants = _maxParticipants;
        p.claimedCount = 0;
        p.createdAt = block.timestamp;
        p.expiresAt = expiresAt;
        p.isActive = true;
        p.mintBadge = _mintBadge;

        for (uint256 i = 0; i < _optionTexts.length; i++) {
            pollOptions[newPollId].push(Option({
                text: _optionTexts[i],
                voteCount: 0
            }));
        }

        emit PollCreated(newPollId, msg.sender, _title, _rewardPoolTotal, _maxParticipants, expiresAt);
        return newPollId;
    }

    /**
     * @dev Registers a vote, ensures 1 vote per address, and transfers micro-reward instantly.
     */
    function voteAndReward(uint256 _pollId, uint256 _optionIndex) external {
        Poll storage p = polls[_pollId];
        require(p.isActive, "Poll is not active");
        require(block.timestamp < p.expiresAt, "Poll has expired");
        require(!hasVoted[_pollId][msg.sender], "Address has already voted in this poll");
        require(p.claimedCount < p.maxParticipants, "Reward pool fully claimed");
        require(_optionIndex < pollOptions[_pollId].length, "Invalid option index");

        // Record vote
        hasVoted[_pollId][msg.sender] = true;
        pollOptions[_pollId][_optionIndex].voteCount += 1;
        p.claimedCount += 1;
        pollVoters[_pollId].push(msg.sender);

        uint256 reward = p.rewardPerVote;

        // Automatically close poll if max participants reached
        if (p.claimedCount >= p.maxParticipants) {
            p.isActive = false;
        }

        // Instant Micro-Reward Transfer
        if (reward > 0 && usdcToken != address(0)) {
            IERC20(usdcToken).transfer(msg.sender, reward);
        }

        emit VoteCast(_pollId, msg.sender, _optionIndex, reward);
    }

    /**
     * @dev Retrieves option choices and vote counts for a poll.
     */
    function getPollOptions(uint256 _pollId) external view returns (string[] memory texts, uint256[] memory counts) {
        Option[] storage opts = pollOptions[_pollId];
        texts = new string[](opts.length);
        counts = new uint256[](opts.length);
        for (uint256 i = 0; i < opts.length; i++) {
            texts[i] = opts[i].text;
            counts[i] = opts[i].voteCount;
        }
    }
}
`;
