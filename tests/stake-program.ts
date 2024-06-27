import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeProgram } from "../target/types/stake_program";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

describe("test", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // wallet
  const payer = provider.wallet as anchor.Wallet;

  // connection
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");

  // 铸造的keypair
  const mintKeypair = Keypair.fromSecretKey(
    new Uint8Array([
      164, 132, 244, 170,  16, 236,  71, 148,  50, 173, 208,
       63, 235,  48, 179,  73,  43, 251, 131, 107, 118,  97,
      118, 188,  92, 109, 110, 217,  68, 232, 232,  14,  39,
      162, 108, 118,   1, 223, 224,  75, 193,  13, 127,  43,
      221,  77, 170, 233, 128, 218, 253, 184, 210, 218,  53,
       27, 101,  58, 100,  50,  91,  16, 241, 219
    ])
  );
  // const mintKeypair = Keypair.generate();
  // console.log(mintKeypair);

  const program = anchor.workspace.StakeProgram as Program<StakeProgram>;

  async function createMintToken() {
    const mint = await createMint(
      connection,
      payer.payer,
      payer.publicKey,
      payer.publicKey,
      9,
      mintKeypair,
    )
    console.log(mint)
    return mint
  }

  it("Is initialized!", async () => {
    // 创建mint token
    // let mint = await createMintToken();

    // 创建vault账户
    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    // 将账户存放里面
    let initAccount = {
      signer: payer.publicKey,
      tokenVaultAccount: vaultAccount,
      mint: mintKeypair.publicKey,
    };

    const tx = await program.methods
      .initialize()
      // 对应合约里面initialize里面的字段
      .accounts(initAccount)
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("stake", async () => {

    // 创建user的token账户
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey,
    )

    // 为userTokenAccount铸造一些token
    await mintTo(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      userTokenAccount.address,
      payer.payer,
      1e11,
    );

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId
    );

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    );

    await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey,
    );

    let requiredAccount = {
      stakeInfoAccount: stakeInfo,
      stakeAccount: stakeAccount,
      userTokenAccount: userTokenAccount.address,
      mint: mintKeypair.publicKey,
      signer: payer.publicKey,
    }

    const tx = await program.methods
      .stake(new anchor.BN(1))
      .signers([payer.payer])
      .accounts(requiredAccount)
      .rpc();

      console.log("Your transaction signature", tx);
  });

  it("unstake", async () => {

    // 创建user的token账户
    let userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      payer.publicKey,
    )

    let [stakeInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake_info"), payer.publicKey.toBuffer()],
      program.programId
    );

    let [stakeAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("token"), payer.publicKey.toBuffer()],
      program.programId
    );

    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    // 为vaultAccount铸造一些token
    await mintTo(
      connection,
      payer.payer,
      mintKeypair.publicKey,
      vaultAccount,
      payer.payer,
      1e21,
    );


    let requiredAccount = {
      tokenVaultAccount: vaultAccount,
      stakeInfoAccount: stakeInfo,
      userTokenAccount: userTokenAccount.address,
      stakeAccount: stakeAccount,
      signer: payer.publicKey,
      mint: mintKeypair.publicKey,
    }

    const tx = await program.methods
      .unstake()
      .signers([payer.payer])
      .accounts(requiredAccount)
      .rpc();

      console.log("Your transaction signature", tx);
  });
});
