const vectorWeight = 0.3;
const fullTextWeight = 0.7;

export const getAggregatePipeline = (
  type: "users" | "tweets",
  query: string,
  queryEmbedding?: Float32Array
) => {
  const pipeline: any[] = [];

  const vectorPipeline = [
    {
      $vectorSearch: {
        index: type === "users" ? "users-vector-index" : "tweets-vector-index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 450,
        limit: 50,
      },
    },
    { $group: { _id: null, docs: { $push: "$$ROOT" } } },
    { $unwind: { path: "$docs", includeArrayIndex: "rank" } },
    {
      $addFields: {
        vs_score: {
          $multiply: [
            vectorWeight,
            { $divide: [1.0, { $add: ["$rank", 60] }] },
          ],
        },
      },
    },
    {
      $project:
        type === "users"
          ? {
              vs_score: 1,
              _id: "$docs._id",
              username: "$docs.username",
              bio: "$docs.bio",
              avatar: "$docs.avatar",
              followers: "$docs.followers",
            }
          : {
              vs_score: 1,
              _id: "$docs._id",
              content: "$docs.content",
              postedBy: "$docs.postedBy",
              postedTweetTime: "$docs.postedTweetTime",
              retweetBtn: "$docs.retweetBtn",
              likeTweetBtn: "$docs.likeTweetBtn",
              tag: "$docs.tag",
              isRetweeted: "$docs.isRetweeted",
              isEdited: "$docs.isEdited",
              image: "$docs.image",
              createdAt: "$docs.createdAt",
              updatedAt: "$docs.updatedAt",
              likes: "$docs.likes",
              retweets: "$docs.retweets",
              comments: "$docs.comments",
            },
    },
  ];

  const fullTextPipeline = [
    {
      $search: {
        index: type === "users" ? "users-text-index" : "tweets-text-index",
        text: {
          query,
          path: type === "users" ? ["username", "bio"] : ["content", "tag"],
          fuzzy: {
            maxEdits: 2,
            prefixLength: 1,
            maxExpansions: 50,
          },
        },
      },
    },
    {
      $limit: 50,
    },
    { $group: { _id: null, docs: { $push: "$$ROOT" } } },
    { $unwind: { path: "$docs", includeArrayIndex: "rank" } },
    {
      $addFields: {
        fts_score: {
          $multiply: [
            fullTextWeight,
            { $divide: [1.0, { $add: ["$rank", 60] }] },
          ],
        },
      },
    },
    {
      $replaceRoot: { newRoot: "$docs" },
    },
    {
      $lookup: {
        from: "users",
        localField: "postedBy",
        foreignField: "_id",
        as: "postedByUser",
      },
    },
    {
      $unwind: {
        path: "$postedByUser",
        // preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        postedBy: {
          _id: "$postedByUser._id",
          username: "$postedByUser.username",
          avatar: "$postedByUser.avatar",
          bio: "$postedByUser.bio",
        },
      },
    },
    // Step 1: Lookup comments
    {
      $lookup: {
        from: "comments",
        localField: "comments",
        foreignField: "_id",
        as: "comments",
      },
    },
    // Step 2: Unwind comments to populate postedBy
    {
      $unwind: {
        path: "$comments",
        // preserveNullAndEmptyArrays: true,
      },
    },
    // Step 3: Lookup postedBy user inside each comment
    {
      $lookup: {
        from: "users",
        localField: "comments.postedBy",
        foreignField: "_id",
        as: "comments.postedByUser",
      },
    },
    {
      $unwind: {
        path: "$comments.postedByUser",
        // preserveNullAndEmptyArrays: true,
      },
    },
    // Step 4: Format postedBy field inside comment
    {
      $addFields: {
        "comments.postedBy": {
          _id: "$comments.postedByUser._id",
          username: "$comments.postedByUser.username",
          avatar: "$comments.postedByUser.avatar",
          bio: "$comments.postedByUser.bio",
        },
      },
    },
    // Step 5: Remove postedByUser helper field
    {
      $project: {
        "comments.postedByUser": 0,
      },
    },
    // Step 6: Regroup comments into array under each tweet
    {
      $group: {
        _id: "$_id",
        doc: { $first: "$$ROOT" },
        comments: { $push: "$comments" },
      },
    },
    {
      $addFields: {
        "doc.comments": "$comments",
      },
    },
    {
      $replaceRoot: {
        newRoot: "$doc",
      },
    },

    {
      $project: {
        fts_score: 1,
        _id: 1,
        content: 1,
        postedBy: 1,
        postedTweetTime: 1,
        retweetBtn: 1,
        likeTweetBtn: 1,
        tag: 1,
        isRetweeted: 1,
        retweetedByUser: 1,
        isEdited: 1,
        image: 1,
        createdAt: 1,
        updatedAt: 1,
        likes: 1,
        retweets: 1,
        comments: 1, // Include populated comments field
        followers: 1,
      },
    },
  ];

  if (type === "users") {
    pipeline.push(
      ...vectorPipeline,
      {
        $unionWith: {
          coll: type,
          pipeline: fullTextPipeline,
        },
      },
      // Add combined_score before grouping
      {
        $addFields: {
          combined_score: {
            $add: [
              { $ifNull: ["$fts_score", 0] },
              { $ifNull: ["$vs_score", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$doc",
        },
      },
      {
        $sort: { combined_score: -1 },
      },
      {
        $limit: 50,
      }
    );
  } else {
    pipeline.push([
      {
        $search: {
          index: "tweets-text-index",
          text: {
            query,
            path: ["content", "tag"],
            fuzzy: {
              maxEdits: 2,
              prefixLength: 1,
              maxExpansions: 50,
            },
          },
        },
      },
      {
        $addFields: {
          fts_score: { $meta: "searchScore" },
        },
      },
      { $sort: { fts_score: -1 } },
      { $limit: 50 },

      // Lookup postedBy user
      {
        $lookup: {
          from: "users",
          localField: "postedBy",
          foreignField: "_id",
          as: "postedByUser",
        },
      },
      {
        $unwind: {
          path: "$postedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          postedBy: {
            _id: "$postedByUser._id",
            username: "$postedByUser.username",
            avatar: "$postedByUser.avatar",
            bio: "$postedByUser.bio",
          },
        },
      },

      // Lookup comments
      {
        $lookup: {
          from: "comments",
          localField: "comments",
          foreignField: "_id",
          as: "comments",
        },
      },
      {
        $unwind: {
          path: "$comments",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.postedBy",
          foreignField: "_id",
          as: "comments.postedByUser",
        },
      },
      {
        $unwind: {
          path: "$comments.postedByUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "comments.postedBy": {
            _id: "$comments.postedByUser._id",
            username: "$comments.postedByUser.username",
            avatar: "$comments.postedByUser.avatar",
            bio: "$comments.postedByUser.bio",
          },
        },
      },
      {
        $project: {
          "comments.postedByUser": 0,
        },
      },

      // Regroup comments
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
          comments: { $push: "$comments" },
        },
      },
      {
        $addFields: {
          "doc.comments": "$comments",
        },
      },
      {
        $replaceRoot: {
          newRoot: "$doc",
        },
      },

      // Final projection
      {
        $project: {
          fts_score: 1,
          _id: 1,
          content: 1,
          postedBy: 1,
          postedTweetTime: 1,
          retweetBtn: 1,
          likeTweetBtn: 1,
          tag: 1,
          isRetweeted: 1,
          retweetedByUser: 1,
          isEdited: 1,
          image: 1,
          createdAt: 1,
          updatedAt: 1,
          likes: 1,
          retweets: 1,
          comments: 1,
          followers: 1,
        },
      },
    ]);
  }

  return pipeline;
};
