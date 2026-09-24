import * as THREE from "three";
import {
  InstancedMesh,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
  Matrix4,
  DynamicDrawUsage,
  PlaneGeometry,
  Color,
  Object3D, // Group の代わりに Object3D を基本クラスとして使うか検討 (今回は内部でMeshを持つ形)
} from "three";

import { PointsNodeMaterial } from "three/webgpu";
import { texture, uniform, screenSize } from "three/tsl";

import { TextureManager } from "../TextureManager";

/**
 * 塵のようなパーティクルです。(InstancedMesh + PointsNodeMaterial 版)
 */
export class DustParticleGroup extends THREE.Object3D {
  // Group の代わりに Object3D を継承 (Mesh を直接 add するため)
  private _mesh: InstancedMesh;
  private _instancedGeometry: InstancedBufferGeometry;
  private _instanceSpeedAttribute: InstancedBufferAttribute;
  private _speedList: number[] = []; // 速度データ保持用

  private yStart: number;
  private yEnd: number;
  private particleNum: number;

  /**
   * コンストラクターです。
   * @param particleNum パーティクルの個数。
   * @param yStart Y座標の開始（ループ時）
   * @param yEnd Y座標の終了（ループ時）
   * @param yVariance Y座標の初期値のばらつき
   */
  constructor(particleNum: number, yStart: number, yEnd: number, yVariance: number) {
    super();

    this.particleNum = particleNum;
    this.yStart = yStart;
    this.yEnd = yEnd;

    const SIZE = 3000; // パーティクル発生範囲

    // 1. 基本形状 (PlaneGeometry)
    const baseGeometry = new PlaneGeometry(1, 1); // 各パーティクルは 1x1 の平面

    // 2. InstancedBufferGeometry を作成
    this._instancedGeometry = new InstancedBufferGeometry();
    if (baseGeometry.index) {
      this._instancedGeometry.index = baseGeometry.index;
    }
    for (const name in baseGeometry.attributes) {
      this._instancedGeometry.setAttribute(name, baseGeometry.attributes[name]);
    }
    this._instancedGeometry.instanceCount = particleNum;

    // 3. インスタンスごとの属性 (速度) を作成
    const speeds = new Float32Array(particleNum);
    for (let i = 0; i < particleNum; i++) {
      const speed = Math.random() * Math.random();
      speeds[i] = speed;
      this._speedList[i] = speed; // update で使うために保持
    }
    this._instanceSpeedAttribute = new InstancedBufferAttribute(speeds, 1);
    this._instancedGeometry.setAttribute("instanceSpeed", this._instanceSpeedAttribute);

    // 4. マテリアル (PointsNodeMaterial) を作成
    const material = new PointsNodeMaterial();

    const textureInstance = TextureManager.circle;
    const textureNode = texture(textureInstance);

    // r175 のサイズ計算（size² / depth）を維持する。
    // r186 で追加された「画面の物理高さ / 2」による拡大を相殺する。
    const particleScreenSize = 2.0;
    material.sizeNode = uniform(2 * particleScreenSize ** 2).div(screenSize.y);

    // カラー/透明度ノードにテクスチャを使用
    material.colorNode = textureNode;
    material.opacityNode = textureNode.a;

    // のブレンドモードに戻す
    material.blending = THREE.AdditiveBlending;
    material.transparent = true;
    material.depthTest = true;
    material.depthWrite = false;

    // 5. InstancedMesh を作成
    this._mesh = new InstancedMesh(this._instancedGeometry, material, particleNum);
    this._mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    this.add(this._mesh); // Object3D に Mesh を追加

    // 6. 各インスタンスの初期位置を設定
    const matrix = new Matrix4();
    const initialPositions = new Float32Array(particleNum * 3); // 初期位置保持用 (不要かも？)

    for (let i = 0; i < particleNum; i++) {
      const x = SIZE * (Math.random() - 0.5);
      const y = yVariance * Math.random() + yStart;
      const z = SIZE * (Math.random() - 0.5);
      matrix.setPosition(x, y, z);
      this._mesh.setMatrixAt(i, matrix);
      initialPositions[i * 3 + 0] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;
    }
    this._mesh.instanceMatrix.needsUpdate = true; // 最初に一度更新
  }

  public update(deltaTime: number): void {
    const matrices = this._mesh.instanceMatrix.array;
    const baseSpeedFactor = 60; // 時間ベースアニメーションの係数

    for (let i = 0; i < this.particleNum; i++) {
      // Y座標だけを更新し、行列16要素の往復コピーを避ける。
      const offset = i * 16 + 13;
      const currentY = matrices[offset];
      const speed = this._speedList[i]; // 保持しておいた速度を取得

      // 新しいY座標を計算
      let nextY = currentY + speed * deltaTime * baseSpeedFactor;

      // 範囲チェック
      if (nextY > this.yEnd) {
        // 境界を超えた移動量も保ち、fpsによる周回速度の差をなくす。
        nextY = this.yStart + ((nextY - this.yStart) % (this.yEnd - this.yStart));
      }

      // 行列のY座標を更新
      matrices[offset] = nextY;
    }

    // インスタンス行列全体の更新フラグを立てる
    this._mesh.instanceMatrix.needsUpdate = true;
  }
}
