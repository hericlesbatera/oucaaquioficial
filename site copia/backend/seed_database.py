"""
Seed script to populate the database with initial data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from models import User, Artist, Album, Song
from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.artists.delete_many({})
    await db.albums.delete_many({})
    await db.songs.delete_many({})
    print("✓ Cleared existing data")
    
    # Create Artists/Users
    artists_data = [
        {
            "user": User(
                id="u1",
                name="Maria Santos",
                email="maria@redmusic.com",
                type="artist",
                isPremium=True,
                avatar="https://i.pravatar.cc/150?img=5"
            ),
            "artist": Artist(
                id="a1",
                userId="u1",
                name="Maria Santos",
                bio="Cantora e compositora brasileira",
                avatar="https://i.pravatar.cc/150?img=5",
                coverImage="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
                genre="Pop, R&B",
                location="São Paulo, Brasil",
                followers=45230,
                monthlyListeners=125000
            )
        },
        {
            "user": User(
                id="u2",
                name="Pedro Oliveira",
                email="pedro@redmusic.com",
                type="artist",
                isPremium=True,
                avatar="https://i.pravatar.cc/150?img=15"
            ),
            "artist": Artist(
                id="a2",
                userId="u2",
                name="Pedro Oliveira",
                bio="Rapper e produtor musical",
                avatar="https://i.pravatar.cc/150?img=15",
                coverImage="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
                genre="Hip-Hop, Rap",
                location="Rio de Janeiro, Brasil",
                followers=89540,
                monthlyListeners=340000
            )
        },
        {
            "user": User(
                id="u3",
                name="Ana Costa",
                email="ana@redmusic.com",
                type="artist",
                isPremium=True,
                avatar="https://i.pravatar.cc/150?img=9"
            ),
            "artist": Artist(
                id="a3",
                userId="u3",
                name="Ana Costa",
                bio="Música eletrônica e experimental",
                avatar="https://i.pravatar.cc/150?img=9",
                coverImage="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
                genre="Electronic, Synthwave",
                location="Porto Alegre, Brasil",
                followers=62100,
                monthlyListeners=198000
            )
        }
    ]
    
    # Insert users and artists
    for data in artists_data:
        await db.users.insert_one(data["user"].dict())
        await db.artists.insert_one(data["artist"].dict())
    
    print("✓ Created 3 artists")
    
    # Create Albums
    albums_data = [
        Album(
            id="alb1",
            title="Noites de Verão",
            artistId="a1",
            artistName="Maria Santos",
            coverImage="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
            releaseYear=2024,
            songCount=2
        ),
        Album(
            id="alb2",
            title="Rimas da Quebrada",
            artistId="a2",
            artistName="Pedro Oliveira",
            coverImage="https://images.unsplash.com/photo-1619983081563-430f63602796?w=300",
            releaseYear=2023,
            songCount=2
        ),
        Album(
            id="alb3",
            title="Synthwave Dreams",
            artistId="a3",
            artistName="Ana Costa",
            coverImage="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300",
            releaseYear=2024,
            songCount=2
        )
    ]
    
    for album in albums_data:
        await db.albums.insert_one(album.dict())
    
    print("✓ Created 3 albums")
    
    # Create Songs
    songs_data = [
        Song(
            id="s1",
            title="Luz do Luar",
            artistId="a1",
            artistName="Maria Santos",
            albumId="alb1",
            albumName="Noites de Verão",
            duration=245,
            coverImage="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
            audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            genre="Pop",
            plays=1250000,
            likes=45000,
            releaseYear=2024
        ),
        Song(
            id="s2",
            title="Horizonte",
            artistId="a1",
            artistName="Maria Santos",
            albumId="alb1",
            albumName="Noites de Verão",
            duration=198,
            coverImage="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300",
            audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            genre="Pop",
            plays=980000,
            likes=32000,
            releaseYear=2024
        ),
        Song(
            id="s3",
            title="Flow Pesado",
            artistId="a2",
            artistName="Pedro Oliveira",
            albumId="alb2",
            albumName="Rimas da Quebrada",
            duration=212,
            coverImage="https://images.unsplash.com/photo-1619983081563-430f63602796?w=300",
            audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            genre="Hip-Hop",
            plays=2100000,
            likes=89000,
            releaseYear=2023
        ),
        Song(
            id="s4",
            title="Midnight Drive",
            artistId="a3",
            artistName="Ana Costa",
            albumId="alb3",
            albumName="Synthwave Dreams",
            duration=267,
            coverImage="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300",
            audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            genre="Electronic",
            plays=1560000,
            likes=62000,
            releaseYear=2024
        ),
        Song(
            id="s5",
            title="Neon Lights",
            artistId="a3",
            artistName="Ana Costa",
            albumId="alb3",
            albumName="Synthwave Dreams",
            duration=234,
            coverImage="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300",
            audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
            genre="Electronic",
            plays=1320000,
            likes=54000,
            releaseYear=2024
        ),
        Song(
            id="s6",
            title="Realidade",
            artistId="a2",
            artistName="Pedro Oliveira",
            albumId="alb2",
            albumName="Rimas da Quebrada",
            duration=189,
            coverImage="https://images.unsplash.com/photo-1619983081563-430f63602796?w=300",
            audioUrl="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
            genre="Hip-Hop",
            plays=1890000,
            likes=71000,
            releaseYear=2023
        )
    ]
    
    for song in songs_data:
        await db.songs.insert_one(song.dict())
    
    print("✓ Created 6 songs")
    
    print("\n🎉 Database seeded successfully!")
    print(f"- Users: {await db.users.count_documents({})}")
    print(f"- Artists: {await db.artists.count_documents({})}")
    print(f"- Albums: {await db.albums.count_documents({})}")
    print(f"- Songs: {await db.songs.count_documents({})}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
