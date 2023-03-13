#!/usr/bin/python3 -i

import pandas as pd


def process_csv(df, threshold=3000):
    species_set = set(df["ScientificName"].values.tolist())
    for species in species_set :
        count = len(df[df["ScientificName"]==species])
        #print(count)
        if count<threshold :
            df = df[df["ScientificName"] != species]
    return df


if __name__ == "__main__":
    data = pd.read_csv("./deep_sea_corals.csv")
    data = data.drop(index=0)
    data = data[["ScientificName","ObservationDate", "latitude",
                 "longitude", "DepthInMeters", "LocationAccuracy"]]
    data = process_csv(data)
    data.to_csv("deep_sea_corals(filtered).csv")
