import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StakeProgram } from "../target/types/stake_program";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";

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
      79, 80, 39, 72, 243, 4, 29, 87, 58, 175, 132, 17, 239, 247, 46, 196, 181,
      82, 28, 242, 130, 236, 24, 72, 103, 146, 55, 66, 158, 6, 90, 189, 60, 84,
      54, 180, 88, 102, 53, 211, 146, 180, 7, 105, 104, 139, 140, 68, 61, 215,
      47, 85, 106, 44, 227, 222, 118, 206, 19, 218, 58, 200, 59, 159,
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
    let mint = await createMintToken();

    // 创建vault账户
    let [vaultAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      program.programId
    );

    // 将账户存放里面
    let initAccount = {
      signer: payer.publicKey,
      tokenVaultAccount: vaultAccount,
      mint: mint.toBase58(),
    };

    const tx = await program.methods
      .initialize()
      // 对应合约里面initialize里面的字段
      .accounts(initAccount)
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
