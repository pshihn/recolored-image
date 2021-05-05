# recolored-image

Custom element to show image shifted to a different color. 

Sometimes you want to show an image, usually a logo in different colors. If you had the logo in SVG, then you could easily change the colors using CSS. But what if the image is a png or a jpeg?

`recolored-image` is a custom-element to show an image color shifted to a target color. You can also save this new image.

This adapted and inspired from [@vjeux/image-recolor/](https://github.com/vjeux/image-recolor/) and the related [@tweet](https://twitter.com/Vjeux/status/1387856671238627333?s=20)

## Usage

Install from npm 

```
npm i recolored-image
```

or use directly in your web page

```html
<script type="module" src="https://unpkg.com/recolored-image?module"></script>
```

In your HTML
```html
<!-- original image -->
<img src="./logo.png"> 
<!-- colored versions -->
<recolored-image src="./logo.png" color="#D0021B"></recolored-image>
<recolored-image src="./logo.png" color="#417505"></recolored-image>
<recolored-image src="./logo.png" color="#8B572A"></recolored-image>
```

<img width="1074" src="https://user-images.githubusercontent.com/833927/117084021-e93fb500-acfa-11eb-9f11-89a46d7b2cb2.png">

## Demo

You can play with it live on [Codesandbox](https://codesandbox.io/s/recolored-image-demo-uq8q4)
