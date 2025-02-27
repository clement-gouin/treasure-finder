# Treasure Finder
*Maybe the real treasure is the friends we make along the way*

### [Tool link](https://clement-gouin.github.io/treasure-finder/)

## Data format

Format is made line by line:

Header (1 line, optional)
```txt
1   minimum distance to show secret (int, default is 20 meters)
```

Point (4 lines):
```txt
1   latitude
2   longitude
3   secret (html)
4   point name (can be empty)
```

## Samples

```txt
48.85832397934772
2.2940806701383734
<i>You found me !</i>
sample point
```

```txt
20
48.85832397934772
2.2940806701383734
<i icon=bot></i> <i>Bite my shinny metal a**</i>
<i icon=map-pin></i> sample point #1
48.805777275710795
2.1173228217352578
<i icon=circle-check-big></i> <i>You found me !</i>
<i icon=map-pin></i> sample point #2
```

## Tips

* [Material design colors](https://materialui.co/colors/) are available, you can use `class="red-500"` on your HTML
* [Lucide icons](https://lucide.dev/icons) are available, you can use `<i icon=house></i>` on your HTML