export const checkSemanticRelation = async (currentWord, newWord) => {
  // Primary queries
  const primaryQueries = [
    `ml=${currentWord}`,
    `sl=${currentWord}`,
    `sp=${currentWord}`,
    `rel_syn=${currentWord}`,
    `rel_ant=${currentWord}`,
    `rel_hom=${currentWord}`,
  ];

  // Secondary queries
  const secondaryQueries = [
    `rel_trg=${currentWord}`,
    `rel_jja=${currentWord}`,
    `rel_jjb=${currentWord}`,
    `rel_bga=${currentWord}`,
    `rel_bgb=${currentWord}`,
    `rel_spc=${currentWord}`,
    `rel_gen=${currentWord}`,
    `rel_com=${currentWord}`,
    `rel_par=${currentWord}`,
    `rel_cns=${currentWord}`,
  ];

  try {
    // Process primary queries first
    const primaryResults = await Promise.all(
      primaryQueries.map((query) =>
        fetch(`https://api.datamuse.com/words?${query}`).then((res) =>
          res.json()
        )
      )
    );

    const relatedWords = primaryResults.flat().map((item) => item.word);
    const isPrimaryRelated = relatedWords.includes(newWord);

    if (isPrimaryRelated) {
      return true; // If related based on primary relations, return true immediately
    } else {
      // Optionally process secondary queries if primary checks fail
      const secondaryResults = await Promise.all(
        secondaryQueries.map((query) =>
          fetch(`https://api.datamuse.com/words?${query}`).then((res) =>
            res.json()
          )
        )
      );

      const secondaryRelatedWords = secondaryResults
        .flat()
        .map((item) => item.word);
      return secondaryRelatedWords.includes(newWord);
    }
  } catch (error) {
    console.error("Error checking word relations:", error);
    return false;
  }
};
