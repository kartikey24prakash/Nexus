import Item from "../models/item.model.js";

// ─── GET /api/graph ────────────────────────────────────────────────────────────
// returns nodes (items) and edges (shared tags between items)
export const getGraph = async (req, res, next) => {
  try {
    // fetch all items for this user — only fields needed for graph
    const items = await Item.find({ user: req.user._id })
      .select("_id title type tags thumbnail createdAt collection")
      .populate("collection", "name color")
      .lean();

    if (!items.length) {
      return res.json({ success: true, nodes: [], edges: [] });
    }

    // ── Build nodes ────────────────────────────────────────────────────────────
    const nodes = items.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      type: item.type,
      tags: item.tags,
      thumbnail: item.thumbnail,
      createdAt: item.createdAt,
      collection: item.collection
        ? {
            id: item.collection._id.toString(),
            name: item.collection.name,
            color: item.collection.color,
          }
        : null,
    }));

    // ── Build edges ────────────────────────────────────────────────────────────
    // two items are connected if they share at least one tag
    const edges = [];
    const edgeSet = new Set(); // prevent duplicate edges

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const itemA = items[i];
        const itemB = items[j];

        // find shared tags
        const sharedTags = itemA.tags.filter((tag) =>
          itemB.tags.includes(tag)
        );

        if (sharedTags.length > 0) {
          const edgeKey = [itemA._id, itemB._id].sort().join("-");

          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              source: itemA._id.toString(),
              target: itemB._id.toString(),
              sharedTags,
              strength: sharedTags.length, // more shared tags = stronger connection
            });
          }
        }
      }
    }

    res.json({
      success: true,
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/graph/clusters ───────────────────────────────────────────────────
// groups items by their most common tag — topic clustering
export const getClusters = async (req, res, next) => {
  try {
    const items = await Item.find({ user: req.user._id })
      .select("_id title type tags thumbnail")
      .lean();

    if (!items.length) {
      return res.json({ success: true, clusters: [] });
    }

    // count tag frequency
    const tagCount = {};
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // group items by their most frequent tag
    const clusters = {};
    items.forEach((item) => {
      if (!item.tags.length) return;

      // pick the tag with highest frequency as cluster key
      const primaryTag = item.tags.reduce((best, tag) =>
        (tagCount[tag] || 0) > (tagCount[best] || 0) ? tag : best
      );

      if (!clusters[primaryTag]) {
        clusters[primaryTag] = { tag: primaryTag, items: [], count: 0 };
      }
      clusters[primaryTag].items.push({
        id: item._id.toString(),
        title: item.title,
        type: item.type,
        thumbnail: item.thumbnail,
      });
      clusters[primaryTag].count++;
    });

    // sort clusters by size
    const sortedClusters = Object.values(clusters).sort(
      (a, b) => b.count - a.count
    );

    res.json({ success: true, clusters: sortedClusters });
  } catch (error) {
    next(error);
  }
};
