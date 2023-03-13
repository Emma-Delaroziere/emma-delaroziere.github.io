# visu-biodiversite

## Présentation

On cherche à observer la répartition des espèces au cours du temps et à les recouper avec les prédictions climatiques pour savoir quelles régions seraient menacées. La partie de prédiction se fait avec du machine learning (ML inachevé).

On présente également un matrice d'adjacence de différentes espèces pour essayer de mettre en évidence la présence dans une même aire d'espèces différentes, et ainsi voir quelles espèces font partie du même écosystème. Pour chaque espèce, on crée des clusters avec les points de relevés géographiques (méthode KMeans de scikit-learn), puis on calcule l'enveloppe convexe de chaque cluster à l'aide de la bibliothèque scipy.spatial. On considère qu'un point d'une espèce A est à cheval sur l'aire d'une espèce B quand le point de l'espèce A est positionné à l'intérieur d'un des clusters de l'espèce B. On calcule donc une métrique de chevauchement : le pourcentage des points de l'espèce A étant à cheval sur l'aire de l'espèce B. Le code est joint dans le dossier "data".

:warning: La bibliothèque de calcul d'enveloppe convexe ayant rencontré des problèmes internes, un nombre de clusters par espèce très bas a été considéré, ce qui peut biaiser les résultats.

:warning: La projection des points ne collant pas à la projection sur la carte, la position de visu des points n'est pas représentative de leur position géographique.


## Prototype papier

![Prototype papier](prototype_papier.jpg)

## Installation

Décompresser l'archive "data" dans le dossier du projet en conservant le même nom.

Dans le terminal, se placer dans le répertoire du projet et lancer un simple serveur html.

```
python3 -m http.server
```


## Crédits

Données des coraux utilisés pour la démonstrations : https://www.kaggle.com/datasets/noaa/deep-sea-corals?resource=download

Données pour le tracé de la carte : https://github.com/martynafford/natural-earth-geojson