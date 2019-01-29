db.comment.aggregate({ $match: { "tracking.clickLink" : { $ne : null}} }, { $unwind: "$tracking.clickLink" },  { $group : { _id : "$tracking.clickLink.goto", count : { $sum : 1 }}})