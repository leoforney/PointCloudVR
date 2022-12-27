# PointCloudVR

Point Cloud object viewer in WebXR
This project's locomotion stems from [Sean Bradley's TeleportVR](https://github.com/Sean-Bradley/TeleportVR)

```bash
git clone https://github.com/leoforney/PointCloudVR
cd PointCloudVR
npm install
npm run dev
```

Visit https://127.0.0.1:3000/

## How to import TeleportVR

```bash
npm install teleportvr
```

Import it into your code

```javascript
import TeleportVR from "teleportvr";
```

## How to Instantiate And Use

After creating your `THREE.Scene` and `THREE.Camera`, create a new **TeleportVR** object.

```javascript
const teleportVR = new TeleportVR(scene, camera);
```

Create geometries for the hands and add controller grips, see example code for more info.

Update **TeleportVR** in your render loop

```javascript
teleportVR.update();
renderer.render(scene, camera);
```

## TeleportVR Source Project

This is a typescript project consisting of two sub projects with there own _tsconfigs_.

To edit this example, then modify the files in `./src/client/` or `./src/server/`

The projects will auto recompile if you started it by using _npm run dev_

## Threejs TypeScript Course

Visit https://github.com/Sean-Bradley/Three.js-TypeScript-Boilerplate for a Threejs TypeScript boilerplate containing many extra branches that demonstrate many examples of Threejs.

> To help support this Threejs example, please take a moment to look at my official Threejs TypeScript course at

[![Threejs TypeScript Course](threejs-course-image.png)](https://www.udemy.com/course/threejs-tutorials/?referralCode=4C7E1DE91C3E42F69D0F)

[Three.js and TypeScript](https://www.udemy.com/course/threejs-tutorials/?referralCode=4C7E1DE91C3E42F69D0F)<br/>  
 Discount Coupons for all my courses can be found at [https://sbcode.net/coupons](https://sbcode.net/coupons)
