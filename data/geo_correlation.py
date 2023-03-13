#!/usr/bin/python3

import pandas as pd
from sklearn.cluster import KMeans
from scipy.spatial import ConvexHull
import numpy as np
import json
from math import floor

features = ["latitude", "longitude"]

def geo_cluster(df, cluster_number = 2):
    data_set = df.loc[:, features]
    kmeans = KMeans(n_clusters=cluster_number).fit(data_set)
    clusters = kmeans.predict(data_set)
    df["Cluster"] = clusters
    return cluster_number

    
def geo_hull(df):
    data_set = df.loc[:, features]
    hull_indices = ConvexHull(data_set).vertices.tolist()
    hull = df.loc[hull_indices, features]
    return hull

def get_all_hulls(df):
    species_set = set(df["ScientificName"].values.tolist())
    #print(species_set)
    dic = {}

    #create clusters for each species
    for species in species_set:
        species_df = df[df["ScientificName"]==species].copy().reset_index()
        n_clusters = geo_cluster(species_df)
        dic[species] = []

        #find convex hull for each cluster
        for i in range(n_clusters):
            cluster_df = species_df.loc[species_df["Cluster"]==i].copy().reset_index()
            if len(cluster_df)>=3 :
                cluster_info = {}
                cluster_info["hull"] = geo_hull(cluster_df).to_numpy()
                cluster_info["entries"] = cluster_df.loc[:, features].to_numpy()
                dic[species].append(cluster_info)
    return dic



def in_hull(vertices, point):
    cross_list = []
    for i in range(1, len(vertices)):
        cross = ((vertices[i-1][0] - vertices[i][0])*(point[1] - vertices[i][1])
                  - (vertices[i-1][1] - vertices[i][1])*(point[0] - vertices[i][0]))
        cross_list.append(cross>=0)
    return (True in cross_list) ^ (False in cross_list)

def overlap_species(species_a, species_b):
    
    # can't get overlap if no cluster in first place
    if (len(species_a)==0) or (len(species_b)==0) :
        return float("NaN")
    
    # testing if species could belong to other species area
    belongs_in_a = []

    total_b = 0
    for cluster_b in species_b :
        total_b += len(cluster_b["entries"])
        for point in cluster_b["entries"]:
            for cluster_a in species_a :    
                if in_hull(cluster_a["hull"], point):
                    belongs_in_a.append(1)

    # computing overlapping metrics
    return sum(belongs_in_a)/total_b


def adjacency_matrix(hulls):
    matrix = {}
    for species_a in hulls :
        for species_b in hulls :
            matrix[species_a] = {species_b :
                                 overlap_species(hulls[species_a],
                                                 hulls[species_b])}
    print("Adjacency matrix: ", matrix)
    with open('adjacency.json', 'w') as f:
        json.dump(matrix, f)
    

if __name__ == "__main__" :
    data = pd.read_csv("deep_sea_corals(filtered).csv")
    data.sort_values("ScientificName")
    hulls = get_all_hulls(data)
    #print(hulls)
    adjacency_matrix(hulls)
