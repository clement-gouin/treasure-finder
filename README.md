# Treasure Finder
*Maybe the real treasure is the friends we make along the way*

### [Tool link](https://clement-gouin.github.io/treasure-finder/)

## Data format

Format is made line by line:

Header (1 line, optional)
```txt
1   minimum distance to show secret (int, default is 10 meters)
```

Point (4 lines):
```txt
1   latitude
2   longitude
3   secret (html)
4   point name (can be empty)
```

## Sample

```txt
20
48.85832397934772
2.2940806701383734
<i>Bite my shinny metal a**</i>
sample point #1
48.805777275710795
2.1173228217352578
<i>You found me !</i>
sample point #2
```